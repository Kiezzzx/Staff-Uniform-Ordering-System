const express = require('express');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

router.get('/cooldown', settingsController.getCooldown);
router.patch('/cooldown', settingsController.updateCooldown);

module.exports = router;
