const logger = require('../utils/logger');
const fs = require('fs');
const { processCsvForEmbedding } = require('../utils/csv');
const { createEmbeddings } = require('../utils/embedding');
const { sanitizeText } = require('../utils/sanitizer');

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

    await fs.promises.writeFile(
      'data/embedding.json', 
      JSON.stringify(classifiedEmbeddings, null, 2)
    );
    logger.info(`Successfully wrote to json`);
  } catch (error) {
    logger.error(`Failed to process CSV: ${error.message}`);
    throw error;
  }
};

module.exports = csvEmbedding;
