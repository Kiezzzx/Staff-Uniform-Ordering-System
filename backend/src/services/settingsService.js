const settingsRepository = require('../repositories/settingsRepository');

const COOLDOWN_KEY = 'COOLDOWN_DAYS';
const DEFAULT_COOLDOWN_DAYS = 30;

const parseCooldownValue = (rawValue) => {
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return DEFAULT_COOLDOWN_DAYS;
  }
  return parsed;
};

const getCooldown = async () => {
  const row = await settingsRepository.getSettingByKey(COOLDOWN_KEY);
  return {
    cooldownDays: parseCooldownValue(row?.value),
  };
};

const updateCooldown = async ({ cooldownDays }) => {
  const parsed = Number(cooldownDays);
  if (!Number.isInteger(parsed) || parsed < 0) {
    const error = new Error('cooldownDays must be an integer >= 0.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  await settingsRepository.upsertSetting(COOLDOWN_KEY, String(parsed));
  return { cooldownDays: parsed };
};

module.exports = {
  getCooldown,
  updateCooldown,
};
