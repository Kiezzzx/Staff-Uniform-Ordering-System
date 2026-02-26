const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const name = String(file?.originalname || '').toLowerCase();
    const mimetype = String(file?.mimetype || '').toLowerCase();
    const isCsvName = name.endsWith('.csv');
    const isCsvMime =
      mimetype === 'text/csv' ||
      mimetype === 'application/vnd.ms-excel' ||
      mimetype === 'text/plain';

    if (isCsvName || isCsvMime) {
      cb(null, true);
      return;
    }

    const error = new Error('Only CSV files are allowed.');
    error.code = 'VALIDATION_ERROR';
    cb(error);
  },
});

module.exports = upload;
