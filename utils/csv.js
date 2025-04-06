import csv from 'csvtojson';
import path from 'path';
import logger from './logger.js';

export const parseCsvToJson = async (filePath) => {
  try {
    logger.info(`Parsing CSV file: ${filePath}`);
    const absolutePath = path.resolve(filePath);
    const jsonArray = await csv().fromFile(absolutePath);
    if (!jsonArray?.length) {
      logger.error('CSV file is empty or invalid');
      throw new Error('CSV file is empty or invalid');
    }

    logger.info(`Successfully parsed CSV file with ${jsonArray.length} rows`);
    return jsonArray;
  } catch (error) {
    logger.error(`Failed to parse CSV file: ${error.message}`);
    throw new Error(`Failed to parse CSV file: ${error.message}`);
  }
};

export const processCsvForEmbedding = async (filePath, categoryColumn, textColumn) => {
  try {
    logger.info(
      `Processing CSV for embedding with category: ${categoryColumn}, text: ${textColumn}`
    );
    const csvData = await parseCsvToJson(filePath);

    // Validate that the required columns exist somewhere in the CSV
    const columnsExist = csvData.some(
      (row) =>
        Object.prototype.hasOwnProperty.call(row, categoryColumn) &&
        Object.prototype.hasOwnProperty.call(row, textColumn)
    );

    if (!columnsExist) {
      logger.error(
        `Required columns ${categoryColumn} or ${textColumn} not found in CSV`
      );
      throw new Error(
        `Required columns ${categoryColumn} or ${textColumn} not found in CSV`
      );
    }
    let skippedRows = 0;
    const processedData = csvData
      .reduce((acc, row, index) => {
        // Only include rows where both fields are present and non-empty
        if (!row[categoryColumn]?.trim() || !row[textColumn]?.trim()) {
          skippedRows++;
          logger.debug(
            `Skipping row ${index + 1}: Missing or empty required data`
          );
          return acc;
        }
        acc.push(row);
        return acc;
      }, [])
      .sort((a, b) => a[categoryColumn].localeCompare(b[categoryColumn]));

    if (!processedData.length) {
      logger.error('No valid data rows found after filtering');
      throw new Error('No valid data rows found after filtering');
    }
    if (skippedRows > 0) {
      logger.warn(`Skipped ${skippedRows} rows due to missing data`);
    }
    logger.info(`Successfully processed ${processedData.length} valid rows`);
    return processedData;
  } catch (error) {
    logger.error(`CSV processing failed: ${error.message}`);
    throw new Error(`CSV processing failed: ${error.message}`);
  }
};
