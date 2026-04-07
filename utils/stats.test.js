import { test } from 'node:test';
import assert from 'node:assert';
import { resolveBestCategory, calculateMetrics } from './stats.js';

test('resolveBestCategory', async (t) => {
  await t.test('returns empty string for empty predictions', () => {
    assert.strictEqual(resolveBestCategory([]), '');
  });

  await t.test('majority vote (unweighted)', () => {
    const predictions = [
      { category: 'A' },
      { category: 'B' },
      { category: 'A' },
    ];
    assert.strictEqual(resolveBestCategory(predictions, false), 'A');
  });

  await t.test('weighted averages', () => {
    const predictions = [
      { category: 'A', score: 0.8 },
      { category: 'B', score: 0.9 },
      { category: 'A', score: 0.7 },
    ];
    // A: (0.8 + 0.7) / 2 = 0.75
    // B: 0.9 / 1 = 0.9
    assert.strictEqual(resolveBestCategory(predictions, true), 'B');
  });
});

test('calculateMetrics', async (t) => {
  await t.test('calculates correct metrics for valid input', () => {
    const predictions = [
      { category: 'A', confidence: 0.8 },
      { category: 'B', confidence: 0.6 },
    ];
    const actuals = [{ category: 'A' }, { category: 'A' }];

    const metrics = calculateMetrics(predictions, actuals);

    assert.strictEqual(metrics.totalPredictions, 2);
    assert.strictEqual(metrics.correctPredictions, 1);
    assert.strictEqual(metrics.accuracy, 0.5);
    assert.strictEqual(metrics.avgConfidence, 0.7);
    assert.strictEqual(metrics.categoryMetrics['A'].predicted, 1);
    assert.strictEqual(metrics.categoryMetrics['A'].actual, 2);
    assert.strictEqual(metrics.categoryMetrics['A'].correct, 1);
    assert.strictEqual(metrics.categoryMetrics['B'].predicted, 1);
  });

  await t.test('throws error for mismatched lengths', () => {
    assert.throws(() => {
      calculateMetrics([{}], []);
    }, /Invalid input/);
  });

  await t.test('handles empty arrays', () => {
    const metrics = calculateMetrics([], []);
    assert.strictEqual(metrics.totalPredictions, 0);
    assert.strictEqual(metrics.accuracy, 0);
  });
});
