const Employee = require('../models/Employee');

const EMPLOYEE_EDITABLE_SELF_FIELDS = ['phone', 'profileImage'];

function buildQuery({ search, department, role, status }) {
  const query = { isDeleted: { $ne: true } };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (department) query.department = department;
  if (role) query.role = role;
  if (status) query.status = status;
  return query;
}

async function listEmployees(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      department,
      role,
      status,
      sortBy = 'joiningDate',
      order = 'desc',
    } = req.query;

    const allowedSort = ['joiningDate', 'name'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'joiningDate';
    const sortOrder = order === 'asc' ? 1 : -1;

    const query = buildQuery({ search, department, role, status });
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .populate('reportingManager', 'name employeeId designation')
        .sort({ [sortField]: sortOrder })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Employee.countDocuments(query),
    ]);

    return res.json({
      data: employees,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch employees.', error: err.message });
  }
}

async function getEmployeeById(req, res) {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate(
      'reportingManager',
      'name employeeId designation'
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    return res.json({ data: employee });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch employee.', error: err.message });
  }
}

async function createEmployee(req, res) {
  try {
    if (req.user.role === 'Employee') {
      return res.status(403).json({ message: 'Employees cannot create records.' });
    }
    const payload = { ...req.body };
    if (req.user.role === 'HR Manager' && payload.role === 'Super Admin') {
      return res.status(403).json({ message: 'HR Managers cannot assign the Super Admin role.' });
    }
    const employee = await Employee.create(payload);
    return res.status(201).json({ message: 'Employee created.', data: employee.toSafeObject() });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Employee ID or email already exists.' });
    }
    return res.status(400).json({ message: 'Failed to create employee.', error: err.message });
  }
}

async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const target = await Employee.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!target) return res.status(404).json({ message: 'Employee not found.' });

    const isSelf = String(target._id) === String(req.user._id);

    if (req.user.role === 'Employee') {
      if (!isSelf) {
        return res.status(403).json({ message: 'You can only edit your own profile.' });
      }
      const updates = {};
      for (const field of EMPLOYEE_EDITABLE_SELF_FIELDS) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      }
      Object.assign(target, updates);
      await target.save();
      return res.json({ message: 'Profile updated.', data: target.toSafeObject() });
    }

    if (req.user.role === 'HR Manager') {
      if (req.body.role === 'Super Admin' || target.role === 'Super Admin') {
        return res.status(403).json({ message: 'HR Managers cannot modify Super Admin accounts or assign that role.' });
      }
    }

    // Prevent an employee from being set as their own manager
    if (req.body.reportingManager && String(req.body.reportingManager) === String(target._id)) {
      return res.status(400).json({ message: 'An employee cannot report to themselves.' });
    }

    Object.assign(target, req.body);
    await target.save();
    return res.json({ message: 'Employee updated.', data: target.toSafeObject() });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Employee ID or email already exists.' });
    }
    return res.status(400).json({ message: 'Failed to update employee.', error: err.message });
  }
}

async function deleteEmployee(req, res) {
  try {
    if (req.user.role !== 'Super Admin') {
      return res.status(403).json({ message: 'Only Super Admin can delete employees.' });
    }
    const employee = await Employee.findById(req.params.id);
    if (!employee || employee.isDeleted) {
      return res.status(404).json({ message: 'Employee not found.' });
    }
    // Soft delete
    employee.isDeleted = true;
    employee.status = 'Inactive';
    await employee.save();

    // Reassign direct reports to the deleted employee's manager (if any) to avoid dangling refs
    await Employee.updateMany(
      { reportingManager: employee._id },
      { $set: { reportingManager: employee.reportingManager || null } }
    );

    return res.json({ message: 'Employee soft-deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete employee.', error: err.message });
  }
}

module.exports = {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
