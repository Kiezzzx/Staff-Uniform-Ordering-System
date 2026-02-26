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

  const code = err?.code || 'INTERNAL_SERVER_ERROR';
  const status = STATUS_BY_CODE[code] || 500;
  const message = err?.message || 'An unexpected error occurred.';

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
