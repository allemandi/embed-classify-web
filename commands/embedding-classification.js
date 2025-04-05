const { parseCsvToJson } = require('../utils/csv');
const logger = require('../utils/logger');
const fs = require('fs');
const { rankSamplesBySimilarity } = require('../utils/embedding');
const { resolveBestCategory, calculateMetrics } = require('../utils/stats');
const { sanitizeText, formatCSVRow } = require('../utils/sanitizer');

const embeddingClassification = async (
  inputFile,
  comparisonFile,
  outputFile,
  resultMetrics,
  evaluateModel
) => {
  const weightedVotes = true;
  const comparisonPercentage = 80;
  const maxSamplesToSearch = 40;
  const similarityThresholdPercent = 30;
  const csvHeaderStrings = {
    category: 'category',
    comment: 'comment',
    nearestCosineScore: 'nearest_cosine_score',
    similarSamplesCount: 'similar_samples_count',
  };

  let jsonData;
  try {
    const jsonFile = await fs.promises.readFile(comparisonFile, 'utf-8');
    jsonData = JSON.parse(jsonFile);
  } catch (err) {
    logger.error(`Failed to read or parse comparison file: ${err.message}`);
    throw err;
  }

  logger.info(`Fetching ${jsonData.length} samples from comparison set`);

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const randomizedEmbeddingArray = shuffle([...jsonData]);
  const originalEmbeddingLength = randomizedEmbeddingArray.length;
  const majorityIndex = Math.round(
    originalEmbeddingLength * (comparisonPercentage / 100)
  );

  const comparisonData = randomizedEmbeddingArray.slice(0, majorityIndex);
  logger.info(
    `Reserving ${comparisonPercentage}% (${comparisonData.length}) of original dataset to compare.`
  );

  if (evaluateModel) {
    const evaluateData = randomizedEmbeddingArray.slice(majorityIndex);
    logger.info(
      `Starting model evaluation preview using remaining ${100 - comparisonPercentage}% (${evaluateData.length}) of samples.`
    );

    // Process evaluation in chunks to prevent memory issues
    const chunkSize = 100;
    const evaluationResults = [];
    
    for (let i = 0; i < evaluateData.length; i += chunkSize) {
      const chunk = evaluateData.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (item) => {
          const searchResults = await rankSamplesBySimilarity(
            item.text,
            comparisonData,
            maxSamplesToSearch,
            similarityThresholdPercent
          );
          const predictedCategory = resolveBestCategory(searchResults, weightedVotes) || '???';
          const confidence = searchResults[0]?.score || 0;

          return {
            text: item.text,
            category: predictedCategory,
            confidence,
            actualCategory: item.category,
          };
        })
      );
      evaluationResults.push(...chunkResults);
    }

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
  
  // Process output in chunks
  const chunkSize = 100;
  const outputArr = [];
  
  for (let i = 0; i < inputData.length; i += chunkSize) {
    const chunk = inputData.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async ({comment}) => {
        const sanitizedText = sanitizeText(comment);
        const searchResults = await rankSamplesBySimilarity(
          sanitizedText,
          comparisonData,
          maxSamplesToSearch,
          similarityThresholdPercent
        );
        const predictedCategory = resolveBestCategory(searchResults, weightedVotes) || '???';
        const nearestCosineScore = searchResults[0]?.score || 0;

        return {
          text: sanitizedText,
          category: predictedCategory,
          nearestCosineScore,
          similarSamplesCount: searchResults.length,
        };
      })
    );
    outputArr.push(...chunkResults);
  }

  const outputString = [
    resultMetrics
      ? formatCSVRow([
          csvHeaderStrings.category,
          csvHeaderStrings.comment,
          csvHeaderStrings.nearestCosineScore,
          csvHeaderStrings.similarSamplesCount,
        ])
      : formatCSVRow([csvHeaderStrings.category, csvHeaderStrings.comment]),
    ...outputArr.map((i) =>
      resultMetrics
        ? formatCSVRow([
            i.category,
            i.text,
            (i.nearestCosineScore * 100).toFixed(2),
            i.similarSamplesCount,
          ])
        : formatCSVRow([i.category, i.text])
    ),
  ].join('\n');

  try {
    await fs.promises.writeFile(outputFile, outputString);
    logger.info(`\nResults have been written to ${outputFile}`);
  } catch (err) {
    logger.error(`Failed to write output file: ${err.message}`);
    throw err;
  }
};

module.exports = embeddingClassification;
