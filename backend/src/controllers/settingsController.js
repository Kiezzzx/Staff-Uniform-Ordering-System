const settingsService = require('../services/settingsService');

const getCooldown = async (req, res, next) => {
  try {
    const data = await settingsService.getCooldown();
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
};

const updateCooldown = async (req, res, next) => {
  try {
    const { cooldownDays } = req.body || {};
    const data = await settingsService.updateCooldown({ cooldownDays });
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCooldown,
  updateCooldown,
};
