const returnMostFrequentElement = async (input) => {
  const map = new Map();
  let maxCount = 0;
  let mostFrequentElement = "";
  for(const element of input){
    const count = (map.get(element) || 0) + 1;
    map.set(element, count);
    if(count > maxCount) {
      maxCount = count;
      mostFrequentElement = element;
    }
  }
  return mostFrequentElement;
};
/**
 * Calculates evaluation metrics by comparing predicted values with actual values.
 * @param {Array} predictions - Array of prediction objects with 'category' and 'confidence'.
 * @param {Array} actuals - Array of actual values with 'category'.
 * @returns {Object} Metrics including accuracy, average confidence, and per-category statistics.
 */
const calculateMetrics = (predictions, actuals) => {
  if (!Array.isArray(predictions) || !Array.isArray(actuals) || predictions.length !== actuals.length) {
    throw new Error('Invalid input: predictions and actuals must be arrays of equal length');
  }
// eli5 notes
// Correct Predictions: every time a guess happens and the category is right
// Accuracy = (Correct Predictions) / (Total Valid Guesses)
// Average Confidence = (Sum of all confidence scores) / (Total Guesses Made)

  const metrics = {
    totalPredictions: predictions.length,
    correctPredictions: 0,
    categoryMetrics: {},
    avgConfidence: 0,
    accuracy: 0
  };

  let totalConfidence = 0;
  let validPredictionsCount = 0; // Count of valid predictions (existing prediction)
  let validPairCount = 0;        // Count of valid pairs (both prediction and actual exist)

  for (let i = 0; i < predictions.length; i++) {
    const prediction = predictions[i];
    const actual = actuals[i];

    // Process prediction (if valid)
    if (prediction != null) {
      const predictedCategory = prediction.category || "unknown";
      const confidence = prediction.confidence !== undefined ? prediction.confidence : 0;
      totalConfidence += confidence;
      validPredictionsCount++;

      // Initialize category metrics for predicted category if not exists
      if (!metrics.categoryMetrics[predictedCategory]) {
        metrics.categoryMetrics[predictedCategory] = { predicted: 0, correct: 0, actual: 0 };
      }
      metrics.categoryMetrics[predictedCategory].predicted++;
    }

    // Process actual (if valid)
    if (actual != null) {
      const actualCategory = actual.category || "unknown";

      // Initialize category metrics for actual category if not exists
      if (!metrics.categoryMetrics[actualCategory]) {
        metrics.categoryMetrics[actualCategory] = { predicted: 0, correct: 0, actual: 0 };
      }
      metrics.categoryMetrics[actualCategory].actual++;
    }

    // Process correctness if both prediction and actual are valid
    if (prediction != null && actual != null) {
      validPairCount++;

      const predictedCategory = prediction.category || "unknown";
      const actualCategory = actual.category || "unknown";

      if (predictedCategory === actualCategory) {
        metrics.correctPredictions++;
        // Ensure the category entry exists before incrementing correct count
        if (metrics.categoryMetrics[predictedCategory]) {
          metrics.categoryMetrics[predictedCategory].correct++;
        } else {
          metrics.categoryMetrics[predictedCategory] = { predicted: 0, correct: 1, actual: 0 };
        }
      }
    }
  }
  // Calculate accuracy
  metrics.accuracy = validPairCount > 0 ? metrics.correctPredictions / validPairCount : 0;

  // Calculate average confidence
  metrics.avgConfidence = validPredictionsCount > 0 ? totalConfidence / validPredictionsCount : 0;

  return metrics;
};

module.exports = {
  returnMostFrequentElement,
  calculateMetrics,
};
