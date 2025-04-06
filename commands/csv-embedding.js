import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { processCsvForEmbedding } from '../utils/csv.js';
import { createEmbeddings } from '../utils/embedding.js';
import { sanitizeText } from '../utils/sanitizer.js';

const csvEmbedding = async (inputFile) => {
  try {
    logger.info(`Starting CSV embedding process for file: ${inputFile}`);

    // Verify the input file exists
    if (!fs.existsSync(inputFile)) {
      throw new Error(`Input file not found: ${inputFile}`);
    }

    const csvHeaderStrings = {
      category: 'category',
      comment: 'comment',
    };

    const commentHeader = csvHeaderStrings.comment;
    const categoryHeader = csvHeaderStrings.category;

    logger.info(
      `Processing CSV with headers: category="${categoryHeader}", comment="${commentHeader}"`
    );
    const fileData = await processCsvForEmbedding(
      inputFile,
      categoryHeader,
      commentHeader
    );

    logger.info(`Successfully processed CSV. Found ${fileData.length} rows.`);

    // More efficient data structuring
    const trainingData = {
      category: fileData.map((item) => item.category),
      comment: fileData.map((item) => item.comment),
    };

    // Parallel processing of text sanitization
    logger.info('Sanitizing comment text...');
    const cleanedComments = await Promise.all(
      trainingData.comment.map((text) => Promise.resolve(sanitizeText(text)))
    );
    logger.info('Text sanitization complete');

    // Create embeddings
    logger.info('Creating embeddings, this may take some time...');
    const embeddings = await createEmbeddings(cleanedComments);

    if (!embeddings || embeddings.length === 0) {
      throw new Error('Failed to create embeddings');
    }

    logger.info(`Successfully created ${embeddings.length} embeddings.`);

    const classifiedEmbeddings = embeddings.map((item, index) => ({
      category: trainingData.category[index],
      ...item,
    }));

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      logger.info(`Creating data directory: ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Generate timestamp for uniqueness
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Create both a timestamped file and the standard embedding.json file
    const timestampedPath = path.join(dataDir, `embedding-${timestamp}.json`);
    const standardPath = path.join(dataDir, 'embedding.json');

    logger.info(`Writing timestamped embeddings to ${timestampedPath}`);

    // Write to timestamped file first
    await fs.promises.writeFile(
      timestampedPath,
      JSON.stringify(classifiedEmbeddings, null, 2)
    );

    // Then write to standard path with force flag
    logger.info(`Writing standard embeddings to ${standardPath}`);
    await fs.promises.writeFile(
      standardPath,
      JSON.stringify(classifiedEmbeddings, null, 2)
    );

    // Force sync to ensure file is written to disk
    fs.fsyncSync(fs.openSync(standardPath, 'r+'));

    // Verify files were written
    if (!fs.existsSync(standardPath)) {
      throw new Error(`Failed to write embedding file: ${standardPath}`);
    }

    const stats = fs.statSync(standardPath);
    logger.info(
      `Successfully wrote embeddings to ${standardPath} (${stats.size} bytes)`
    );
    logger.info(`Timestamped backup created at ${timestampedPath}`);

    return standardPath;
  } catch (error) {
    logger.error(`Failed to process CSV: ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
};

export default csvEmbedding;
