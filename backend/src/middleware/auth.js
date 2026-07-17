const { verifyToken } = require('../utils/token');
const Employee = require('../models/Employee');

async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }
    const decoded = verifyToken(token);
    const employee = await Employee.findOne({ _id: decoded.id, isDeleted: { $ne: true } });
    if (!employee) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }
    if (employee.status === 'Inactive') {
      return res.status(403).json({ message: 'Account is inactive. Contact admin.' });
    }
    req.user = employee;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
