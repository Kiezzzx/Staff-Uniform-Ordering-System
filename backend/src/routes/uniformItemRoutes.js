const express = require('express');
const uniformItemController = require('../controllers/uniformItemController');

const router = express.Router();

router.get('/', uniformItemController.listUniformItems);

module.exports = router;
