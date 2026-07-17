const express = require('express');
const multer = require('multer');
const {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const { getReportees, assignManager } = require('../controllers/organizationController');
const { importCsv } = require('../controllers/importController');
const { authenticate, authorize } = require('../middleware/auth');
const { createEmployeeRules, updateEmployeeRules, handleValidation } = require('../middleware/validators');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
const router = express.Router();

router.use(authenticate);

router.get('/', listEmployees);
router.get('/:id', getEmployeeById);
router.get('/:id/reportees', getReportees);
router.post('/', authorize('Super Admin', 'HR Manager'), createEmployeeRules, handleValidation, createEmployee);
router.post('/import', authorize('Super Admin', 'HR Manager'), upload.single('file'), importCsv);
router.put('/:id', updateEmployeeRules, handleValidation, updateEmployee);
router.delete('/:id', authorize('Super Admin'), deleteEmployee);
router.patch('/:id/manager', assignManager);

module.exports = router;
