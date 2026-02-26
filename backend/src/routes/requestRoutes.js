const express = require('express');
const requestController = require('../controllers/requestController');

const router = express.Router();

router.post('/', requestController.createRequest);
router.get('/', requestController.listRequests);
router.get('/:id', requestController.getRequestById);
router.patch('/:id/status', requestController.updateRequestStatus);

module.exports = router;
