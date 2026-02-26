const STATUS_BY_CODE = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  INSUFFICIENT_STOCK: 409,
  ALLOWANCE_EXCEEDED: 409,
  COOLDOWN_ACTIVE: 409,
  INVALID_STATUS_TRANSITION: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const handleNotFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.code = 'NOT_FOUND';
  next(error);
};

const errorHandler = (err, req, res, next) => {
  console.error('[errorHandler] error:', err);
  console.error('[errorHandler] stack:', err?.stack);

  let code = err?.code || 'INTERNAL_SERVER_ERROR';
  let message = err?.message || 'An unexpected error occurred.';

  if (err?.name === 'MulterError') {
    code = 'VALIDATION_ERROR';
    if (err?.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large. Maximum size is 2MB.';
    }
  }

  const status = STATUS_BY_CODE[code] || 500;

  res.status(status).json({
    error: {
      code,
      message,
    },
  });
};

module.exports = {
  handleNotFound,
  errorHandler,
};
