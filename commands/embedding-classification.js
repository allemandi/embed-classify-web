const { parseCsvToJson } = require('../utils/csv');
const logger = require('../utils/logger');
const fs = require('fs');
const { rankSamplesBySimilarity } = require('../utils/embedding');
const {
  resolveBestCategory,
  calculateMetrics,
} = require('../utils/stats');
const { sanitizeText, formatCSVRow } = require('../utils/sanitizer');

const embeddingClassification = async (
  inputFile,
  comparisonFile,
  outputFile,
  resultMetrics,
  evaluateModel,
) => {
  const weightedVotes = true;
  const comparisonPercentage = 80;
  const maxSamplesToSearch = 40;
  // cosine similarity
  const similarityThresholdPercent = 30;
  const csvHeaderStrings = {
    category: 'category',
    comment: 'comment',
    nearestCosineScore: 'nearest_cosine_score',
    similarSamplesCount: 'similar_samples_count',
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
  logger.info(`Fetching ${jsonData.length} samples from comparison set`)

  logger.info(
    `Randomizing dataset.`
  );
  const randomizedEmbeddingArray = jsonData.sort(() => Math.random() - 0.5);

  const originalEmbeddingLength = randomizedEmbeddingArray.length;
  // split random set based on index
  const majorityIndex = Math.round(originalEmbeddingLength * (comparisonPercentage / 100));

  const comparisonData = randomizedEmbeddingArray.slice(0, majorityIndex);
  logger.info(
    `Reserving ${comparisonPercentage}% (${comparisonData.length}) of original dataset to compare.`
  );
  if (evaluateModel === 'true') {
    const evaluateData = randomizedEmbeddingArray.slice(majorityIndex);
    // Evaluation logic
    logger.info(`Starting model evaluation preview using remaining ${100 - comparisonPercentage}% (${evaluateData.length}) of samples.`);
    const evaluationResults = await Promise.all(
      evaluateData.map(async (item) => {
        const searchResults = await rankSamplesBySimilarity(
          item.text,
          comparisonData,
          maxSamplesToSearch,
          similarityThresholdPercent
        );
        const predictedCategory = resolveBestCategory(searchResults, weightedVotes) || '???';
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
    const metrics = calculateMetrics(evaluationResults, evaluateData);

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
      const searchResults = await rankSamplesBySimilarity(
        sanitizedText,
        comparisonData,
        maxSamplesToSearch,
        similarityThresholdPercent
      );
      const predictedCategory = resolveBestCategory(searchResults, weightedVotes) || '???';
      const nearestCosineScore = searchResults.length > 0 ? searchResults[0].score : 0;

      return {
        text: sanitizedText,
        category: predictedCategory,
        nearestCosineScore: nearestCosineScore,
        similarSamplesCount: searchResults.length,
      };
    })

  );

  const outputString = [
    resultMetrics === 'true'
      ? formatCSVRow([
        csvHeaderStrings.category,
        csvHeaderStrings.comment,
        csvHeaderStrings.nearestCosineScore,
        csvHeaderStrings.similarSamplesCount,
      ])
      : formatCSVRow([csvHeaderStrings.category, csvHeaderStrings.comment]),
    ...outputArr.map(i =>
      resultMetrics === 'true'
        ? formatCSVRow([
          i.category,
          i.text,
          (i.nearestCosineScore * 100).toFixed(2), // Fix: was using i.confidence
          i.similarSamplesCount, // Fix: was using i.similarMatches
        ])
        : formatCSVRow([i.category, i.text])
    ),
  ].join('\n');

  // Write to output file
  await fs.promises.writeFile(outputFile, outputString);

  // Log results after file write
  logger.info(`\nResults have been written to ${outputFile}`);
};

module.exports = embeddingClassification;
