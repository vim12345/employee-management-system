const Employee = require('../models/Employee');

async function buildTree() {
  const employees = await Employee.find({ isDeleted: { $ne: true } })
    .select('name employeeId designation department role reportingManager status')
    .lean();

  const byId = new Map(employees.map((e) => [String(e._id), { ...e, children: [] }]));
  const roots = [];

  for (const emp of byId.values()) {
    if (emp.reportingManager && byId.has(String(emp.reportingManager))) {
      byId.get(String(emp.reportingManager)).children.push(emp);
    } else {
      roots.push(emp);
    }
  }
  return roots;
}

async function getOrgTree(req, res) {
  try {
    const tree = await buildTree();
    return res.json({ data: tree });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to build organization tree.', error: err.message });
  }
}

async function getReportees(req, res) {
  try {
    const { id } = req.params;
    const direct = await Employee.find({ reportingManager: id, isDeleted: { $ne: true } }).select(
      'name employeeId designation department status'
    );
    return res.json({ data: direct });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch reportees.', error: err.message });
  }
}

// Detects whether setting `managerId` as the manager of `employeeId` would create a cycle
async function wouldCreateCycle(employeeId, managerId) {
  let currentId = managerId;
  const visited = new Set();
  while (currentId) {
    if (String(currentId) === String(employeeId)) return true;
    if (visited.has(String(currentId))) break; // already-corrupt data guard
    visited.add(String(currentId));
    const manager = await Employee.findById(currentId).select('reportingManager');
    if (!manager) break;
    currentId = manager.reportingManager;
  }
  return false;
}

async function assignManager(req, res) {
  try {
    if (req.user.role === 'Employee') {
      return res.status(403).json({ message: 'You cannot reassign reporting managers.' });
    }
    const { id } = req.params;
    const { managerId } = req.body;

    const employee = await Employee.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    if (managerId) {
      if (String(managerId) === String(id)) {
        return res.status(400).json({ message: 'An employee cannot report to themselves.' });
      }
      const manager = await Employee.findOne({ _id: managerId, isDeleted: { $ne: true } });
      if (!manager) return res.status(404).json({ message: 'Manager not found.' });

      const cycle = await wouldCreateCycle(id, managerId);
      if (cycle) {
        return res.status(400).json({ message: 'This assignment would create a circular reporting structure.' });
      }
      employee.reportingManager = managerId;
    } else {
      employee.reportingManager = null;
    }

    await employee.save();
    return res.json({ message: 'Reporting manager updated.', data: employee.toSafeObject() });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to assign manager.', error: err.message });
  }
}

module.exports = { getOrgTree, getReportees, assignManager };
