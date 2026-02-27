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

const getRoleLimits = async () => {
  const rows = await staffRepository.getRoleAllowanceLimits();
  return rows.map((row) => ({
    role: String(row.roleName || '').toUpperCase(),
    annualLimit: Number(row.annualLimit || 0),
  }));
};

const getRoleCooldowns = async () => {
  const rows = await staffRepository.getRoleCooldownLimits();
  return rows.map((row) => ({
    role: String(row.roleName || '').toUpperCase(),
    cooldownDays: Number(row.cooldownDays || 0),
  }));
};

const updateRoleLimit = async ({ roleName, annualLimit }) => {
  const normalizedRoleName = String(roleName || '').trim().toUpperCase();
  const limit = Number(annualLimit);

  if (!normalizedRoleName) {
    const error = new Error('roleName is required.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (!Number.isInteger(limit) || limit < 0) {
    const error = new Error('annualLimit must be an integer >= 0.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const role = await staffRepository.getRoleByName(normalizedRoleName);
  if (!role) {
    const error = new Error('Role not found.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  await staffRepository.upsertRoleAllowanceLimit(normalizedRoleName, limit);

  return {
    role: normalizedRoleName,
    annualLimit: limit,
  };
};

const updateRoleCooldown = async ({ roleName, cooldownDays }) => {
  const normalizedRoleName = String(roleName || '').trim().toUpperCase();
  const days = Number(cooldownDays);

  if (!normalizedRoleName) {
    const error = new Error('roleName is required.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (!Number.isInteger(days) || days < 0) {
    const error = new Error('cooldownDays must be an integer >= 0.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const role = await staffRepository.getRoleByName(normalizedRoleName);
  if (!role) {
    const error = new Error('Role not found.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  await staffRepository.upsertRoleCooldownLimit(normalizedRoleName, days);

  return {
    role: normalizedRoleName,
    cooldownDays: days,
  };
};

module.exports = {
  getStaff,
  getRoleLimits,
  getRoleCooldowns,
  updateRoleLimit,
  updateRoleCooldown,
};
