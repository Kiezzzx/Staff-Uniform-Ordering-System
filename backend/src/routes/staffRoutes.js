const express = require('express');
const staffController = require('../controllers/staffController');

const router = express.Router();

router.get('/role-limits', staffController.listRoleLimits);
router.patch('/role-limits/:roleName', staffController.updateRoleLimit);
router.get('/', staffController.listStaff);

module.exports = router;
