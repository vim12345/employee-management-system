const express = require('express');
const { getOrgTree } = require('../controllers/organizationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/tree', getOrgTree);

module.exports = router;
