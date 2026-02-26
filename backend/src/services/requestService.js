const staffRepository = require('../repositories/staffRepository');
const uniformItemRepository = require('../repositories/uniformItemRepository');
const requestRepository = require('../repositories/requestRepository');
const { run } = require('../repositories/dbHelpers');

const COOLDOWN_DAYS = 30;
const DEFAULT_ROLE_LIMITS = {
  MANAGER: 5,
  CASUAL: 2,
};

const VALID_STATUSES = ['REQUESTED', 'DISPATCHED', 'ARRIVED', 'COLLECTED'];
const TRANSITION_INDEX = {
  REQUESTED: 0,
  DISPATCHED: 1,
  ARRIVED: 2,
  COLLECTED: 3,
};
const STATUS_TIMESTAMP_FIELD = {
  DISPATCHED: 'dispatched_at',
  ARRIVED: 'arrived_at',
  COLLECTED: 'collected_at',
};

const createError = (code, message, details = null) => {
  const error = new Error(message);
  error.code = code;
  if (details) {
    error.details = details;
  }
  return error;
};

const toUtcDate = (value) => new Date(value);

const getRoleLimitsMap = async () => {
  const rows = await staffRepository.getRoleAllowanceLimits();
  const dbLimits = rows.reduce((acc, row) => {
    acc[String(row.roleName || '').toUpperCase()] = Number(row.annualLimit);
    return acc;
  }, {});

  return {
    ...DEFAULT_ROLE_LIMITS,
    ...dbLimits,
  };
};

const createRequest = async ({ staffId, items, note }) => {
  // STEP 1: Basic Parameter Validation
  const parsedStaffId = Number(staffId);
  if (
    !Number.isInteger(parsedStaffId) ||
    parsedStaffId <= 0 ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw createError('VALIDATION_ERROR', 'staffId is required and items must be a non-empty array.');
  }

  for (const item of items) {
    const uniformItemId = Number(item?.uniformItemId);
    const quantityIsPositiveInt = Number.isInteger(item?.quantity) && item.quantity > 0;
    const uniformItemIdIsPositiveInt = Number.isInteger(uniformItemId) && uniformItemId > 0;

    if (!uniformItemIdIsPositiveInt || !quantityIsPositiveInt) {
      throw createError('VALIDATION_ERROR', 'Each item must include uniformItemId and positive integer quantity.');
    }
  }

  let normalizedNote = null;
  if (note !== undefined && note !== null) {
    if (typeof note !== 'string') {
      throw createError('VALIDATION_ERROR', 'note must be a string.');
    }
    normalizedNote = note.trim();
    if (normalizedNote.length > 500) {
      throw createError('VALIDATION_ERROR', 'note must be 500 characters or less.');
    }
    if (!normalizedNote) {
      normalizedNote = null;
    }
  }

  const seenUniformItemIds = new Set();
  for (const item of items) {
    const uniformItemId = Number(item.uniformItemId);
    if (seenUniformItemIds.has(uniformItemId)) {
      throw createError('VALIDATION_ERROR', `Duplicate uniformItemId in request: ${uniformItemId}.`);
    }
    seenUniformItemIds.add(uniformItemId);
  }

  // STEP 2: Staff Existence Check
  const staff = await staffRepository.getStaffById(parsedStaffId);
  if (!staff) {
    throw createError('NOT_FOUND', 'Staff not found.');
  }

  // STEP 3: UniformItem Existence Check
  const uniformItemsById = new Map();
  for (const item of items) {
    const uniformItemId = Number(item.uniformItemId);
    const uniformItem = await uniformItemRepository.getUniformItemById(uniformItemId);
    if (!uniformItem) {
      throw createError('NOT_FOUND', `Uniform item not found: ${uniformItemId}.`);
    }
    uniformItemsById.set(uniformItemId, uniformItem);
  }

  // STEP 4: Stock Check
  for (const item of items) {
    const uniformItemId = Number(item.uniformItemId);
    const uniformItem = uniformItemsById.get(uniformItemId);
    if (item.quantity > uniformItem.stock_on_hand) {
      throw createError('INSUFFICIENT_STOCK', `Insufficient stock for uniform item: ${uniformItemId}.`);
    }
  }

  // STEP 5: Allowance Check
  const roleName = (staff.role_name || staff.role || '').toUpperCase();
  const roleLimits = await getRoleLimitsMap();
  const yearlyLimit = roleLimits[roleName];

  if (yearlyLimit === undefined || yearlyLimit === null) {
    throw createError('VALIDATION_ERROR', 'Staff role is not configured for allowance limits.');
  }
  if (!Number.isFinite(yearlyLimit) || yearlyLimit < 0) {
    throw createError('VALIDATION_ERROR', 'Configured role allowance limit is invalid.');
  }

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const requestedTotal = items.reduce((sum, item) => sum + item.quantity, 0);
  const usedAllowanceRow = await requestRepository.getUsedAllowanceForYear(parsedStaffId, currentYear);
  const usedAllowance = Number(usedAllowanceRow?.used_quantity || 0);

  if (usedAllowance + requestedTotal > yearlyLimit) {
    throw createError('ALLOWANCE_EXCEEDED', 'Request exceeds allowance limit.');
  }

  // STEP 6: Cooldown Check
  const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  for (const item of items) {
    const uniformItemId = Number(item.uniformItemId);
    const latestRequest = await requestRepository.getLatestRequestForItem(parsedStaffId, uniformItemId);
    const cooldownAnchorAt = latestRequest?.cooldown_anchor_at || latestRequest?.requested_at || null;
    if (!cooldownAnchorAt) {
      continue;
    }

    const latestRequestedAt = toUtcDate(cooldownAnchorAt);
    if (Number.isNaN(latestRequestedAt.getTime())) {
      continue;
    }

    const cooldownUntil = new Date(latestRequestedAt.getTime() + cooldownMs);
    if (now < cooldownUntil) {
      throw createError('COOLDOWN_ACTIVE', `Cooldown active for uniform item: ${uniformItemId}.`);
    }
  }

  const requestedAt = now.toISOString();
  let createdRequest;

  // STEP 7: Begin Transaction
  await run('BEGIN TRANSACTION');

  try {
    // STEP 8: Create Request
    createdRequest = await requestRepository.createUniformRequest(parsedStaffId, requestedAt, normalizedNote);

    // STEP 9: Deduct Stock
    for (const item of items) {
      const uniformItemId = Number(item.uniformItemId);
      const result = await uniformItemRepository.decrementStockIfAvailable(uniformItemId, item.quantity);
      if (!result || result.changes !== 1) {
        throw createError('INSUFFICIENT_STOCK', `Insufficient stock for uniform item: ${uniformItemId}.`);
      }
    }

    // STEP 10: Create Request Items
    for (const item of items) {
      await requestRepository.createUniformRequestItem(
        createdRequest.id,
        Number(item.uniformItemId),
        item.quantity
      );
    }

    // STEP 11: Commit
    await run('COMMIT');

    return {
      id: createdRequest.id,
      staffId: createdRequest.staff_id,
      status: createdRequest.status,
      note: createdRequest.reorder_reason || null,
      requestedAt: createdRequest.requested_at,
    };
  } catch (error) {
    // STEP 12: Catch & Rollback
    try {
      await run('ROLLBACK');
    } catch (rollbackError) {
      throw rollbackError;
    }

    throw error;
  }
};

const getRequests = async (filters) => {
  const rows = await requestRepository.getUniformRequests(filters);

  return rows.map((row) => ({
    id: row.id,
    staffName: row.staffName,
    storeName: row.storeName,
    status: row.status,
    requestedAt: row.requestedAt,
  }));
};

const listRequests = async (filters = {}) => {
  return getRequests(filters);
};

const getRequestById = async ({ id }) => {
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    throw createError('VALIDATION_ERROR', 'id must be a positive integer.');
  }

  const detail = await requestRepository.getUniformRequestDetailById(requestId);
  if (!detail) {
    throw createError('NOT_FOUND', 'Request not found.');
  }

  const items = await requestRepository.getUniformRequestItemsByRequestId(requestId);

  return {
    id: detail.id,
    staffName: detail.staffName,
    storeName: detail.storeName,
    status: detail.status,
    note: detail.reorderReason || null,
    requestedAt: detail.requestedAt,
    items: items.map((item) => ({
      uniformItemId: item.uniformItemId,
      itemName: item.itemName,
      size: item.size,
      quantity: item.quantity,
    })),
  };
};

const updateRequestStatus = async ({ id, status }) => {
  if (!status || !VALID_STATUSES.includes(status)) {
    throw createError('VALIDATION_ERROR', 'status is required and must be a valid value.');
  }

  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    throw createError('VALIDATION_ERROR', 'id must be a positive integer.');
  }

  const currentRequest = await requestRepository.getUniformRequestById(requestId);
  if (!currentRequest) {
    throw createError('NOT_FOUND', 'Request not found.');
  }

  const currentIndex = TRANSITION_INDEX[currentRequest.status];
  const nextIndex = TRANSITION_INDEX[status];

  if (currentRequest.status === 'COLLECTED' || nextIndex !== currentIndex + 1) {
    throw createError(
      'INVALID_STATUS_TRANSITION',
      `Invalid status transition from ${currentRequest.status} to ${status}.`
    );
  }

  const timestampField = STATUS_TIMESTAMP_FIELD[status];
  const now = new Date().toISOString();
  const updatedRequest = await requestRepository.updateUniformRequestStatus(requestId, status, timestampField, now);

  return {
    id: updatedRequest.id,
    status: updatedRequest.status,
  };
};

module.exports = {
  createRequest,
  getRequests,
  listRequests,
  getRequestById,
  updateRequestStatus,
};
