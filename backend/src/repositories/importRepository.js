const { all, get, run } = require('./dbHelpers');

const createImportJob = async (fileName) => {
  const sql = `
    INSERT INTO import_jobs (file_name, total_rows, valid_rows, invalid_rows, created_at)
    VALUES (?, 0, 0, 0, ?)
  `;

  const { lastID } = await run(sql, [fileName, new Date().toISOString()]);
  return lastID;
};

const updateImportJobSummary = async (importJobId, totalRows, validRows, invalidRows) => {
  const sql = `
    UPDATE import_jobs
    SET total_rows = ?, valid_rows = ?, invalid_rows = ?
    WHERE id = ?
  `;

  await run(sql, [totalRows, validRows, invalidRows, importJobId]);
};

const getImportJobById = async (id) => {
  const sql = `
    SELECT id, total_rows, valid_rows, invalid_rows
    FROM import_jobs
    WHERE id = ?
  `;

  return get(sql, [id]);
};

const getImportRowErrorsByJobId = async (importJobId) => {
  const sql = `
    SELECT row_number AS rowNumber, error_message AS message
    FROM import_row_errors
    WHERE import_job_id = ?
    ORDER BY row_number ASC
  `;

  return all(sql, [importJobId]);
};

const insertImportRowError = async (importJobId, rowNumber, errorMessage) => {
  const sql = `
    INSERT INTO import_row_errors (import_job_id, row_number, error_message)
    VALUES (?, ?, ?)
  `;

  await run(sql, [importJobId, rowNumber, errorMessage]);
};

const upsertStore = async (name) => {
  await run('INSERT OR IGNORE INTO stores (name) VALUES (?)', [name]);
  return get('SELECT id, name FROM stores WHERE name = ?', [name]);
};

const upsertRole = async (name) => {
  await run('INSERT OR IGNORE INTO roles (name) VALUES (?)', [name]);
  return get('SELECT id, name FROM roles WHERE name = ?', [name]);
};

const insertStaff = async (name, roleId, storeId) => {
  const sql = 'INSERT OR IGNORE INTO staff (name, store_id, role_id) VALUES (?, ?, ?)';
  await run(sql, [name, storeId, roleId]);
};

const upsertUniformItem = async (sku, size, itemName, stockOnHand) => {
  const sql = `
    INSERT INTO uniform_items (sku, size, item_name, stock_on_hand)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(sku, size)
    DO UPDATE SET stock_on_hand = excluded.stock_on_hand
  `;

  await run(sql, [sku, size, itemName, stockOnHand]);
};

module.exports = {
  createImportJob,
  updateImportJobSummary,
  getImportJobById,
  getImportRowErrorsByJobId,
  insertImportRowError,
  upsertStore,
  upsertRole,
  insertStaff,
  upsertUniformItem,
};
