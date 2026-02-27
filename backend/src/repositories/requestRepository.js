const { get, run, all } = require('./dbHelpers');

const createUniformRequest = async (staffId, requestedAt, note) => {
  const insertSql = `
    INSERT INTO uniform_requests (staff_id, status, reorder_reason, requested_at)
    VALUES (?, 'REQUESTED', ?, ?)
  `;

  const { lastID } = await run(insertSql, [staffId, note, requestedAt]);

  const selectSql = 'SELECT * FROM uniform_requests WHERE id = ?';
  return get(selectSql, [lastID]);
};

const createUniformRequestItem = async (requestId, uniformItemId, quantity) => {
  const insertSql = `
    INSERT INTO uniform_request_items (request_id, uniform_item_id, quantity)
    VALUES (?, ?, ?)
  `;

  const { lastID } = await run(insertSql, [requestId, uniformItemId, quantity]);

  const selectSql = 'SELECT * FROM uniform_request_items WHERE id = ?';
  return get(selectSql, [lastID]);
};

const getUsedAllowanceForYear = async (staffId, year) => {
  const start = `${year}-01-01T00:00:00.000Z`;
  const end = `${Number(year) + 1}-01-01T00:00:00.000Z`;

  const sql = `
    SELECT COALESCE(SUM(uri.quantity), 0) AS used_quantity
    FROM uniform_request_items uri
    INNER JOIN uniform_requests ur ON ur.id = uri.request_id
    WHERE ur.staff_id = ?
      AND ur.status IN ('REQUESTED', 'DISPATCHED', 'ARRIVED', 'COLLECTED')
      AND ur.requested_at >= ?
      AND ur.requested_at < ?
  `;

  return get(sql, [staffId, start, end]);
};

const getUsedAllowanceForYearExcludingRequest = async (staffId, year, excludeRequestId) => {
  const start = `${year}-01-01T00:00:00.000Z`;
  const end = `${Number(year) + 1}-01-01T00:00:00.000Z`;

  const sql = `
    SELECT COALESCE(SUM(uri.quantity), 0) AS used_quantity
    FROM uniform_request_items uri
    INNER JOIN uniform_requests ur ON ur.id = uri.request_id
    WHERE ur.staff_id = ?
      AND ur.id <> ?
      AND ur.status IN ('REQUESTED', 'DISPATCHED', 'ARRIVED', 'COLLECTED')
      AND ur.requested_at >= ?
      AND ur.requested_at < ?
  `;

  return get(sql, [staffId, excludeRequestId, start, end]);
};

const getLatestRequestForItem = async (staffId, uniformItemId) => {
  const sql = `
    SELECT
      ur.*,
      COALESCE(ur.collected_at, ur.requested_at) AS cooldown_anchor_at
    FROM uniform_requests ur
    INNER JOIN uniform_request_items uri ON uri.request_id = ur.id
    WHERE ur.staff_id = ?
      AND uri.uniform_item_id = ?
    ORDER BY cooldown_anchor_at DESC, ur.id DESC
    LIMIT 1
  `;

  return get(sql, [staffId, uniformItemId]);
};

const getLatestRequestForItemExcludingRequest = async (staffId, uniformItemId, excludeRequestId) => {
  const sql = `
    SELECT
      ur.*,
      COALESCE(ur.collected_at, ur.requested_at) AS cooldown_anchor_at
    FROM uniform_requests ur
    INNER JOIN uniform_request_items uri ON uri.request_id = ur.id
    WHERE ur.staff_id = ?
      AND uri.uniform_item_id = ?
      AND ur.id <> ?
    ORDER BY cooldown_anchor_at DESC, ur.id DESC
    LIMIT 1
  `;

  return get(sql, [staffId, uniformItemId, excludeRequestId]);
};

const getUniformRequestById = async (id) => {
  const sql = 'SELECT * FROM uniform_requests WHERE id = ?';
  return get(sql, [id]);
};

const updateUniformRequestStatus = async (id, status, timestampField, timestampValue) => {
  const sql = `
    UPDATE uniform_requests
    SET status = ?, ${timestampField} = ?
    WHERE id = ?
  `;

  await run(sql, [status, timestampValue, id]);

  return getUniformRequestById(id);
};

const getUniformRequests = async ({ status, staffId, storeId }) => {
  let sql = `
    SELECT
      ur.id,
      s.name AS staffName,
      st.name AS storeName,
      ur.status,
      ur.requested_at AS requestedAt
    FROM uniform_requests ur
    INNER JOIN staff s ON s.id = ur.staff_id
    INNER JOIN stores st ON st.id = s.store_id
  `;

  const conditions = [];
  const params = [];

  if (status !== undefined && status !== null && status !== '') {
    conditions.push('ur.status = ?');
    params.push(status);
  }

  if (staffId !== undefined && staffId !== null && staffId !== '') {
    conditions.push('ur.staff_id = ?');
    params.push(staffId);
  }

  if (storeId !== undefined && storeId !== null && storeId !== '') {
    conditions.push('s.store_id = ?');
    params.push(storeId);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ' ORDER BY ur.requested_at DESC';

  return all(sql, params);
};

const getUniformRequestDetailById = async (id) => {
  const sql = `
    SELECT
      ur.id,
      s.name AS staffName,
      st.name AS storeName,
      ur.status,
      ur.reorder_reason AS reorderReason,
      ur.requested_at AS requestedAt
    FROM uniform_requests ur
    INNER JOIN staff s ON s.id = ur.staff_id
    INNER JOIN stores st ON st.id = s.store_id
    WHERE ur.id = ?
  `;

  return get(sql, [id]);
};

const getUniformRequestItemsByRequestId = async (requestId) => {
  const sql = `
    SELECT
      uri.uniform_item_id AS uniformItemId,
      ui.item_name AS itemName,
      ui.size,
      uri.quantity
    FROM uniform_request_items uri
    INNER JOIN uniform_items ui ON ui.id = uri.uniform_item_id
    WHERE uri.request_id = ?
    ORDER BY uri.id ASC
  `;

  return all(sql, [requestId]);
};

const deleteUniformRequestItemsByRequestId = async (requestId) => {
  const sql = `
    DELETE FROM uniform_request_items
    WHERE request_id = ?
  `;

  return run(sql, [requestId]);
};

const deleteUniformRequestById = async (requestId) => {
  const sql = `
    DELETE FROM uniform_requests
    WHERE id = ?
  `;

  return run(sql, [requestId]);
};

const updateUniformRequestForEdit = async (requestId, note) => {
  const sql = `
    UPDATE uniform_requests
    SET reorder_reason = ?
    WHERE id = ?
  `;

  await run(sql, [note, requestId]);
  return getUniformRequestById(requestId);
};

module.exports = {
  createUniformRequest,
  createUniformRequestItem,
  getUsedAllowanceForYear,
  getUsedAllowanceForYearExcludingRequest,
  getLatestRequestForItem,
  getLatestRequestForItemExcludingRequest,
  getUniformRequestById,
  updateUniformRequestStatus,
  getUniformRequests,
  getUniformRequestDetailById,
  getUniformRequestItemsByRequestId,
  deleteUniformRequestItemsByRequestId,
  deleteUniformRequestById,
  updateUniformRequestForEdit,
};
