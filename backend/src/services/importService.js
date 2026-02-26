const { Readable } = require('stream');
const csvParser = require('csv-parser');
const importRepository = require('../repositories/importRepository');

const createError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const cleanHeader = (header) => (header || '').replace(/^\uFEFF/, '').trim();

const parseCsvBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const rows = [];
    const headers = [];

    Readable.from([buffer])
      .pipe(
        csvParser({
          mapHeaders: ({ header }) => cleanHeader(header),
          mapValues: ({ value }) => (typeof value === 'string' ? value.trim() : value),
        })
      )
      .on('headers', (h) => {
        headers.push(...h);
      })
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve({ headers, rows }))
      .on('error', reject);
  });

const detectCsvType = (headers) => {
  const hasStaffHeaders = ['Display Name', 'Role', 'Store'].every((h) => headers.includes(h));
  const hasSkuHeaders = ['EAN', 'Name', 'Qty'].every((h) => headers.includes(h));

  if (hasStaffHeaders) {
    return 'STAFF';
  }

  if (hasSkuHeaders) {
    return 'SKU';
  }

  return null;
};

const parseNameAndSize = (rawName) => {
  const match = String(rawName || '').match(/^(.*)\(([^()]+)\)\s*$/);
  if (!match) {
    return null;
  }

  return {
    itemName: match[1].trim(),
    size: match[2].trim(),
  };
};

const createImport = async ({ fileName, buffer }) => {
  if (!buffer || buffer.length === 0) {
    throw createError('VALIDATION_ERROR', 'CSV file is empty.');
  }

  const importJobId = await importRepository.createImportJob(fileName || 'upload.csv');

  let totalRows = 0;
  let validRows = 0;
  let invalidRows = 0;

  try {
    const { headers, rows } = await parseCsvBuffer(buffer);
    const csvType = detectCsvType(headers);

    if (!csvType) {
      throw createError('VALIDATION_ERROR', 'Unsupported CSV headers.');
    }

    totalRows = rows.length;

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 2;

      try {
        if (csvType === 'STAFF') {
          const displayName = String(row['Display Name'] || '').trim();
          const roleName = String(row.Role || '').trim();
          const storeName = String(row.Store || '').trim();

          if (!displayName || !roleName || !storeName) {
            throw new Error('Missing required staff fields.');
          }

          const store = await importRepository.upsertStore(storeName);
          const role = await importRepository.upsertRole(roleName.toUpperCase());
          await importRepository.insertStaff(displayName, role.id, store.id);
        } else {
          const ean = String(row.EAN || '').trim();
          const name = String(row.Name || '').trim();
          const qtyRaw = String(row.Qty ?? '').trim();
          const qty = Number(qtyRaw);

          if (!ean || !name || qtyRaw === '') {
            throw new Error('Missing required SKU fields.');
          }

          if (!Number.isFinite(qty) || qty < 0) {
            throw new Error('Qty must be a number >= 0.');
          }

          const parsed = parseNameAndSize(name);
          if (!parsed || !parsed.itemName || !parsed.size) {
            throw new Error('Name must include size in parentheses, e.g. Summer T-Shirt (XXL).');
          }

          await importRepository.upsertUniformItem(ean, parsed.size, parsed.itemName, qty);
        }

        validRows += 1;
      } catch (rowError) {
        invalidRows += 1;
        await importRepository.insertImportRowError(importJobId, rowNumber, rowError.message || 'Invalid row');
      }
    }

    await importRepository.updateImportJobSummary(importJobId, totalRows, validRows, invalidRows);

    return { importJobId };
  } catch (error) {
    await importRepository.updateImportJobSummary(importJobId, totalRows, validRows, invalidRows);
    throw error;
  }
};

const getImportSummary = async ({ id }) => {
  const importJobId = Number(id);
  if (!Number.isInteger(importJobId) || importJobId <= 0) {
    throw createError('VALIDATION_ERROR', 'id must be a positive integer.');
  }

  const job = await importRepository.getImportJobById(importJobId);
  if (!job) {
    throw createError('NOT_FOUND', 'Import job not found.');
  }

  const errors = await importRepository.getImportRowErrorsByJobId(importJobId);

  return {
    totalRows: job.total_rows,
    validRows: job.valid_rows,
    invalidRows: job.invalid_rows,
    errors,
  };
};

module.exports = {
  createImport,
  getImportSummary,
};
