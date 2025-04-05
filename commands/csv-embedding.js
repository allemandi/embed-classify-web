const logger = require('../utils/logger');
const { pipeline } = require('@xenova/transformers');
const fs = require('fs');
// const path = require('path');
const { prepareCsvEmbedding } = require('../utils/csv');

const csvEmbedding = async (inputFile) => {
  const csvHeaderStrings = {
    category: 'category',
    comment: 'comment',
  };

  const commentHeader = csvHeaderStrings.comment;
  const categoryHeader = csvHeaderStrings.category;
  // const fileName = path.basename(inputFile);
  const fileData = await prepareCsvEmbedding(
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

  // TODO text cleaning
  // use Xenova/all-MiniLM-L6-v2 model locally
  const extractor = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  );
  const embedding = await extractor(trainingData.comment, {
    pooling: 'mean',
    normalize: true,
  });
  const embeddingOutput = embedding.tolist();

  let results = [];
  for (let i = 0; i < trainingData.comment.length; i++) {
    results.push({
      text: trainingData.comment[i],
      category: trainingData.category[i],
      embedding: embeddingOutput[i],
    });
  }

  results = JSON.stringify(results);

  // CSV Header
  //  let csvContent = "text,embedding\n";

  // Process each row
  //  results.forEach((item) => {
  //    const text = `"${item.text.replace(/"/g, '""')}"`; // Escape quotes for CSV
  //    const embeddingStr = item.embedding.join(" "); // Convert array to space-separated string
  //    csvContent += `${text},${embeddingStr}\n`; // Append row
  //  });

  await fs.promises.writeFile('data/embedding.json', results);
  logger.info(`Successfully wrote to json`);
};
module.exports = csvEmbedding;
