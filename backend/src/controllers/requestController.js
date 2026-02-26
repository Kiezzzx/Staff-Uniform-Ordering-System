const requestService = require('../services/requestService');
const { createHttpError } = require('../errors/createHttpError');

const createRequest = async (req, res, next) => {
  try {
    const { staffId, items, note } = req.body || {};

    if (staffId === undefined || !Array.isArray(items)) {
      return next(createHttpError('VALIDATION_ERROR', 'staffId is required and items must be an array.'));
    }

    const result = await requestService.createRequest({ staffId, items, note });
    return res.status(201).json({ data: result });
  } catch (error) {
    return next(error);
  }
};

const listRequests = async (req, res, next) => {
  try {
    const { status, staffId, storeId } = req.query;

    const items = await requestService.getRequests({ status, staffId, storeId });
    return res.status(200).json({ data: { items } });
  } catch (error) {
    return next(error);
  }
};

const getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await requestService.getRequestById({ id });
    return res.status(200).json({ data: item });
  } catch (error) {
    return next(error);
  }
};

const updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const result = await requestService.updateRequestStatus({ id, status });
    return res.status(200).json({ data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createRequest,
  listRequests,
  getRequestById,
  updateRequestStatus,
};
