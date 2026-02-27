const { get, run } = require('./dbHelpers');

const getSettingByKey = async (key) => {
  const sql = `
    SELECT key, value
    FROM system_settings
    WHERE key = ?
  `;

  return get(sql, [key]);
};

const upsertSetting = async (key, value) => {
  const sql = `
    INSERT INTO system_settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key)
    DO UPDATE SET value = excluded.value
  `;

  await run(sql, [key, value]);
};

module.exports = {
  getSettingByKey,
  upsertSetting,
};
