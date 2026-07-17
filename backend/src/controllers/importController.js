const { parse } = require('csv-parse/sync');
const Employee = require('../models/Employee');

// Expected CSV columns:
// employeeId,name,email,phone,password,department,designation,salary,joiningDate,status,role
async function importCsv(req, res) {
  try {
    if (!['Super Admin', 'HR Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to import employees.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded.' });
    }

    const records = parse(req.file.buffer.toString('utf-8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = { created: 0, failed: [] };

    for (const [index, row] of records.entries()) {
      try {
        if (req.user.role === 'HR Manager' && row.role === 'Super Admin') {
          throw new Error('HR Managers cannot import Super Admin accounts.');
        }
        await Employee.create({
          employeeId: row.employeeId,
          name: row.name,
          email: row.email,
          phone: row.phone,
          password: row.password || 'Welcome@123',
          department: row.department,
          designation: row.designation,
          salary: Number(row.salary),
          joiningDate: new Date(row.joiningDate),
          status: row.status || 'Active',
          role: row.role || 'Employee',
        });
        results.created += 1;
      } catch (rowErr) {
        results.failed.push({ row: index + 2, error: rowErr.message });
      }
    }

    return res.json({ message: 'Import completed.', data: results });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to import CSV.', error: err.message });
  }
}

module.exports = { importCsv };
