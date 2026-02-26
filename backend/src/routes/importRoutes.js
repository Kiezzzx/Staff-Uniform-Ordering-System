const express = require('express');
const importController = require('../controllers/importController');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', upload.single('file'), importController.createImport);
router.get('/:id', importController.getImportSummary);

module.exports = router;
