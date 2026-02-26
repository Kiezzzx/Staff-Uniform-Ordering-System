const { get, all, run } = require('./dbHelpers');

const getStaffById = async (id) => {
  const sql = `
    SELECT s.*, r.name AS role_name
    FROM staff s
    INNER JOIN roles r ON r.id = s.role_id
    WHERE s.id = ?
  `;

  return get(sql, [id]);
};

const getStaffWithUsedAllowanceForYear = async (year) => {
  const start = `${year}-01-01T00:00:00.000Z`;
  const end = `${Number(year) + 1}-01-01T00:00:00.000Z`;

  const sql = `
    SELECT
      s.id,
      s.name,
      st.name AS storeName,
      r.name AS role,
      COALESCE(SUM(uri.quantity), 0) AS usedQuantity
    FROM staff s
    INNER JOIN stores st ON st.id = s.store_id
    INNER JOIN roles r ON r.id = s.role_id
    LEFT JOIN uniform_requests ur
      ON ur.staff_id = s.id
      AND ur.status IN ('REQUESTED', 'DISPATCHED', 'ARRIVED', 'COLLECTED')
      AND ur.requested_at >= ?
      AND ur.requested_at < ?
    LEFT JOIN uniform_request_items uri ON uri.request_id = ur.id
    GROUP BY s.id, s.name, st.name, r.name
    ORDER BY s.id ASC
  `;

  return all(sql, [start, end]);
};

const getRoleAllowanceLimits = async () => {
  const sql = `
    SELECT role_name AS roleName, annual_limit AS annualLimit
    FROM role_allowance_limits
    ORDER BY role_name ASC
  `;

  return all(sql);
};

const getRoleByName = async (name) => {
  const sql = `
    SELECT id, name
    FROM roles
    WHERE UPPER(name) = UPPER(?)
  `;

  return get(sql, [name]);
};

const upsertRoleAllowanceLimit = async (roleName, annualLimit) => {
  const sql = `
    INSERT INTO role_allowance_limits (role_name, annual_limit)
    VALUES (?, ?)
    ON CONFLICT(role_name)
    DO UPDATE SET annual_limit = excluded.annual_limit
  `;

  await run(sql, [roleName, annualLimit]);
};

module.exports = {
  getStaffById,
  getStaffWithUsedAllowanceForYear,
  getRoleAllowanceLimits,
  getRoleByName,
  upsertRoleAllowanceLimit,
};

