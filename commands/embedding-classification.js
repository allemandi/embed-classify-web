const { parseCsvToJson } = require('../utils/csv');
const logger = require('../utils/logger');
const fs = require('fs');
const { rankChunksBySimilarity } = require('../utils/embedding');
const {
  returnMostFrequentElement,
  calculateMetrics,
} = require('../utils/stats');
const { sanitizeText, formatCSVRow } = require('../utils/sanitizer');

const embeddingClassification = async (
  inputFile,
  comparisonFile,
  outputFile,
  evaluateModel,
) => {
  const trainingPercentage = 90;
  const chunksToSearch = 15;
  // cosine similarity
  const similarityThresholdPercent = 50;
  const csvHeaderStrings = {
    category: 'category',
    comment: 'comment',
  };

  const jsonFile = await fs.promises.readFile(
    comparisonFile,
    'utf-8',
    (err, data) => {
      if (err) throw err;
      logger.error(err);
    }
  );

  const jsonData = JSON.parse(jsonFile);

  logger.info(
    `Now randomizing JSON dataset. Reserving ${100 - trainingPercentage}% of original dataset as test samples.`
  );
  const randomizedEmbeddingArray = jsonData.sort(() => Math.random() - 0.5);

  const originalEmbeddingLength = randomizedEmbeddingArray.length;
  const majorityIndex = Math.floor(
    (originalEmbeddingLength - 1) * (trainingPercentage / 100)
  );

  const evaluateArray = randomizedEmbeddingArray.slice(majorityIndex);
  jsonData.splice(majorityIndex);

  if (evaluateModel === 'true') {
    // Evaluation logic
    logger.info('Starting model evaluation preview.');
    const evaluationResults = await Promise.all(
      evaluateArray.map(async (item) => {
        const searchResults = await rankChunksBySimilarity(
          item.text,
          jsonData,
          chunksToSearch,
          similarityThresholdPercent
        );
        const predictedCategoryArray = searchResults.map(
          (result) => result.category
        );
        const predictedCategory =
          (await returnMostFrequentElement(predictedCategoryArray)) || '???';
        const confidence = searchResults.length > 0 ? searchResults[0].score : 0;

        return {
          text: item.text,
          category: predictedCategory,
          confidence: confidence,
          actualCategory: item.category,
        };
      })
    );
    
    // Calculate and display metrics
    const metrics = calculateMetrics(evaluationResults, evaluateArray);

    logger.info('\n=== Model Evaluation Results ===');
    logger.info(`Total Test Samples: ${metrics.totalPredictions}`);
    logger.info(`Correct Predictions: ${metrics.correctPredictions}`);
    logger.info(`Overall Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
    logger.info(
      `Average Confidence: ${(metrics.avgConfidence * 100).toFixed(2)}%`
    );

    logger.info('\n=== Category-wise Performance ===');
    Object.entries(metrics.categoryMetrics).forEach(([category, stats]) => {
      logger.info(`\nCategory: ${category}`);
      logger.info(`├─ Predictions: ${stats.predicted}`);
      logger.info(`├─ Correct: ${stats.correct}`);
      logger.info(`├─ Actual Occurrences: ${stats.actual}`);
      const categoryPrecision =
        stats.predicted > 0
          ? ((stats.correct / stats.predicted) * 100).toFixed(2)
          : '0.00';
      const categoryRecall =
        stats.actual > 0
          ? ((stats.correct / stats.actual) * 100).toFixed(2)
          : '0.00';
      logger.info(`├─ Precision: ${categoryPrecision}%`);
      logger.info(`└─ Recall: ${categoryRecall}%`);
    });
    logger.info('\n');
  }

  const inputData = await parseCsvToJson(inputFile);
  const comments = inputData.map((i) => i.comment);

  const outputArr = await Promise.all(
    comments.map(async (text, i) => {
      const sanitizedText = sanitizeText(text);
      const searchResults = await rankChunksBySimilarity(
        sanitizedText,
        jsonData,
        chunksToSearch,
        similarityThresholdPercent
      );
      const predictedCategoryArray = searchResults.map((text) => text.category);
      const predictedCategory =
        (await returnMostFrequentElement(predictedCategoryArray)) || '???';
      return {
        text: sanitizedText,
        category: predictedCategory,
      };
    })
  );

  const outputString = [
    formatCSVRow([csvHeaderStrings.category, csvHeaderStrings.comment]),
    ...outputArr.map(i => formatCSVRow([i.category, i.text]))
  ].join('\n');
  
  logger.info(outputFile)
  // Write to output file
  await fs.promises.writeFile(outputFile, outputString);
  
  // Log results after file write
  logger.info('\n=== Classification Results ===');
  logger.info(outputString);
  logger.info(`\nResults have been written to ${outputFile}`);
};

module.exports = embeddingClassification;
