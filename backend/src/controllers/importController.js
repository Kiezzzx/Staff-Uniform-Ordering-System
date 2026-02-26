const importService = require('../services/importService');
const { createHttpError } = require('../errors/createHttpError');

const createImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createHttpError('VALIDATION_ERROR', 'file is required.'));
    }

    const result = await importService.createImport({
      fileName: req.file.originalname,
      buffer: req.file.buffer,
    });

    return res.status(201).json({ data: result });
  } catch (error) {
    return next(error);
  }
};

const getImportSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await importService.getImportSummary({ id });
    return res.status(200).json({ data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createImport,
  getImportSummary,
};
