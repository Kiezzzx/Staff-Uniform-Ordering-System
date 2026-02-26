const staffRepository = require('../repositories/staffRepository');

const ROLE_LIMITS = {
  MANAGER: 5,
  CASUAL: 2,
};

const getStaff = async () => {
  const year = new Date().getUTCFullYear();
  const rows = await staffRepository.getStaffWithUsedAllowanceForYear(year);

  return rows.map((row) => {
    const role = String(row.role || '').toUpperCase();
    const limit = ROLE_LIMITS[role] || 0;
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
