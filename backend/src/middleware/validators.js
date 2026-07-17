const { body, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed.', errors: errors.array() });
  }
  next();
}

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const createEmployeeRules = [
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required.'),
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Valid email is required.'),
  body('phone').matches(/^[0-9+\-\s()]{7,15}$/).withMessage('Valid phone number is required.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('department').trim().notEmpty().withMessage('Department is required.'),
  body('designation').trim().notEmpty().withMessage('Designation is required.'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number.'),
  body('joiningDate').isISO8601().withMessage('Valid joining date is required.'),
  body('role').optional().isIn(['Super Admin', 'HR Manager', 'Employee']).withMessage('Invalid role.'),
];

const updateEmployeeRules = [
  body('email').optional().isEmail().withMessage('Valid email is required.'),
  body('phone').optional().matches(/^[0-9+\-\s()]{7,15}$/).withMessage('Valid phone number is required.'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number.'),
  body('joiningDate').optional().isISO8601().withMessage('Valid joining date is required.'),
  body('role').optional().isIn(['Super Admin', 'HR Manager', 'Employee']).withMessage('Invalid role.'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Invalid status.'),
];

module.exports = {
  handleValidation,
  loginRules,
  createEmployeeRules,
  updateEmployeeRules,
};
