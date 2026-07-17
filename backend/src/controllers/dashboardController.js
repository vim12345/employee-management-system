const Employee = require('../models/Employee');

async function getStats(req, res) {
  try {
    const baseMatch = { isDeleted: { $ne: true } };
    const [total, active, inactive, departmentAgg] = await Promise.all([
      Employee.countDocuments(baseMatch),
      Employee.countDocuments({ ...baseMatch, status: 'Active' }),
      Employee.countDocuments({ ...baseMatch, status: 'Inactive' }),
      Employee.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.json({
      data: {
        totalEmployees: total,
        activeEmployees: active,
        inactiveEmployees: inactive,
        departmentCount: departmentAgg.length,
        departmentBreakdown: departmentAgg.map((d) => ({ department: d._id || 'Unassigned', count: d.count })),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch dashboard stats.', error: err.message });
  }
}

module.exports = { getStats };
