const logger = require('../utils/logger');
const fs = require('fs');
const { processCsvForEmbedding } = require('../utils/csv');
const { createEmbeddings } = require('../utils/embedding');
const { sanitizeText } = require('../utils/sanitizer');

const csvEmbedding = async (inputFile) => {
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

  //remap
  const trainingData = fileData.reduce((acc, item) => {
    Object.keys(item).forEach((key) => {
      acc[key] = acc[key] || [];
      acc[key].push(item[key]);
    });
    return acc;
  }, {});
  // Clean text before creating embeddings
  const cleanedComments = trainingData.comment.map(sanitizeText);
  const embeddings = await createEmbeddings(cleanedComments);
  const classifiedEmbeddings = embeddings.map((item, index) => ({
    category: trainingData.category[index],
    ...item,
  }));
  results = JSON.stringify(classifiedEmbeddings);
  await fs.promises.writeFile('data/embedding.json', results);
  logger.info(`Successfully wrote to json`);
};
module.exports = csvEmbedding;
