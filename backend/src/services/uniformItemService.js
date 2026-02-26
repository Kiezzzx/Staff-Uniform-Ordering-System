const uniformItemRepository = require('../repositories/uniformItemRepository');

const LOW_STOCK_THRESHOLD = 5;

const getUniformItems = async () => {
  const rows = await uniformItemRepository.getUniformItems();

  return rows.map((row) => ({
    id: row.id,
    sku: row.sku,
    size: row.size,
    itemName: row.itemName,
    stockOnHand: row.stockOnHand,
    isLowStock: Number(row.stockOnHand) <= LOW_STOCK_THRESHOLD,
  }));
};

module.exports = {
  getUniformItems,
};
