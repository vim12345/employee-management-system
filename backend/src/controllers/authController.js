const Employee = require('../models/Employee');
const { signToken } = require('../utils/token');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const employee = await Employee.findOne({
      email: email.toLowerCase(),
      isDeleted: { $ne: true },
    }).select('+password');

    if (!employee) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    if (employee.status === 'Inactive') {
      return res.status(403).json({ message: 'Account is inactive. Contact admin.' });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken({ id: employee._id, role: employee.role });
    res.cookie('token', token, cookieOptions);

    return res.json({
      message: 'Login successful',
      token,
      user: employee.toSafeObject(),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error during login.', error: err.message });
  }
}

function logout(req, res) {
  res.clearCookie('token', cookieOptions);
  return res.json({ message: 'Logged out successfully.' });
}

async function me(req, res) {
  return res.json({ user: req.user.toSafeObject() });
}

module.exports = { login, logout, me };
