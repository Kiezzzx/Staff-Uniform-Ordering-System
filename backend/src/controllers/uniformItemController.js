const uniformItemService = require('../services/uniformItemService');

const listUniformItems = async (req, res, next) => {
  try {
    const items = await uniformItemService.getUniformItems();
    return res.status(200).json({ data: { items } });
  } catch (error) {
    console.error('[uniformItemController.listUniformItems] error:', error);
    console.error('[uniformItemController.listUniformItems] stack:', error?.stack);
    return next(error);
  }
};

module.exports = {
  listUniformItems,
};
