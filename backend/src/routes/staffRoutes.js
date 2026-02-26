const express = require('express');
const staffController = require('../controllers/staffController');

const router = express.Router();

router.get('/', staffController.listStaff);

module.exports = router;
