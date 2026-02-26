const staffRepository = require('../repositories/staffRepository');

const DEFAULT_ROLE_LIMITS = {
  MANAGER: 5,
  CASUAL: 2,
};

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

const getStaff = async () => {
  const year = new Date().getUTCFullYear();
  const rows = await staffRepository.getStaffWithUsedAllowanceForYear(year);
  const roleLimits = await getRoleLimitsMap();

  return rows.map((row) => {
    const role = String(row.role || '').toUpperCase();
    const limit = roleLimits[role] || 0;
    const used = Number(row.usedQuantity || 0);

    return {
      id: row.id,
      name: row.name,
      storeName: row.storeName,
      role,
      remainingAllowance: Math.max(limit - used, 0),
    };
  });
};

module.exports = {
  getStaff,
};
