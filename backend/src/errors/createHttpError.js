const DEFAULT_MESSAGE_BY_CODE = {
  VALIDATION_ERROR: 'Request validation failed.',
  NOT_FOUND: 'Resource not found.',
  INSUFFICIENT_STOCK: 'Requested quantity exceeds available stock.',
  ALLOWANCE_EXCEEDED: 'Request exceeds allowance limit.',
  COOLDOWN_ACTIVE: 'Cooldown is still active for this item.',
  INVALID_STATUS_TRANSITION: 'Invalid status transition.',
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred.',
};

const createHttpError = (code, message) => {
  const error = new Error(message || DEFAULT_MESSAGE_BY_CODE[code] || DEFAULT_MESSAGE_BY_CODE.INTERNAL_SERVER_ERROR);
  error.code = code || 'INTERNAL_SERVER_ERROR';
  return error;
};

module.exports = {
  createHttpError,
};
