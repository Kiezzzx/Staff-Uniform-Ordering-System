const staffService = require('../services/staffService');

const listStaff = async (req, res, next) => {
  try {
    const items = await staffService.getStaff();
    return res.status(200).json({ data: { items } });
  } catch (error) {
    return next(error);
  }
};

const listRoleLimits = async (req, res, next) => {
  try {
    const items = await staffService.getRoleLimits();
    return res.status(200).json({ data: { items } });
  } catch (error) {
    return next(error);
  }
};

const updateRoleLimit = async (req, res, next) => {
  try {
    const { roleName } = req.params;
    const { annualLimit } = req.body || {};
    const data = await staffService.updateRoleLimit({ roleName, annualLimit });
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listStaff,
  listRoleLimits,
  updateRoleLimit,
};
