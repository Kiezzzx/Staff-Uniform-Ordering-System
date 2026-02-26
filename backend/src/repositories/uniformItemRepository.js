const { get, run, all } = require('./dbHelpers');

const getUniformItemById = async (id) => {
  const sql = 'SELECT * FROM uniform_items WHERE id = ?';
  return get(sql, [id]);
};

const decrementStockIfAvailable = async (uniformItemId, quantity) => {
  const sql = `
    UPDATE uniform_items
    SET stock_on_hand = stock_on_hand - ?
    WHERE id = ? AND stock_on_hand >= ?
  `;

  return run(sql, [quantity, uniformItemId, quantity]);
};

const getUniformItems = async () => {
  const sql = `
    SELECT
      id,
      sku,
      size,
      item_name AS itemName,
      stock_on_hand AS stockOnHand
    FROM uniform_items
    ORDER BY id ASC
  `;

  return all(sql);
};

module.exports = {
  getUniformItemById,
  decrementStockIfAvailable,
  getUniformItems,
};
