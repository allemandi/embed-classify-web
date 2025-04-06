import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { processCsvForEmbedding } from '../utils/csv.js';
import { createEmbeddings } from '../utils/embedding.js';
import { sanitizeText } from '../utils/sanitizer.js';

const csvEmbedding = async (inputFile) => {
  try {
    const csvHeaderStrings = {
      category: 'category',
      comment: 'comment',
    };

    const commentHeader = csvHeaderStrings.comment;
    const categoryHeader = csvHeaderStrings.category;
    const fileData = await processCsvForEmbedding(
      inputFile,
      categoryHeader,
      commentHeader
    );

    // More efficient data structuring
    const trainingData = {
      category: fileData.map(item => item.category),
      comment: fileData.map(item => item.comment)
    };

    // Parallel processing of text sanitization
    const cleanedComments = await Promise.all(
      trainingData.comment.map(text => Promise.resolve(sanitizeText(text)))
    );

    const embeddings = await createEmbeddings(cleanedComments);
    const classifiedEmbeddings = embeddings.map((item, index) => ({
      category: trainingData.category[index],
      ...item,
    }));

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    const outputPath = path.join(dataDir, 'embedding.json');
    await fs.promises.writeFile(
      outputPath, 
      JSON.stringify(classifiedEmbeddings, null, 2)
    );
    logger.info(`Successfully wrote embeddings to ${outputPath}`);
  } catch (error) {
    logger.error(`Failed to process CSV: ${error.message}`);
    throw error;
  }
};

export default csvEmbedding;
