const staffService = require('../services/staffService');

const listStaff = async (req, res, next) => {
  try {
    const items = await staffService.getStaff();
    return res.status(200).json({ data: { items } });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listStaff,
};
