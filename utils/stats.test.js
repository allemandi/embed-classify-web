import { describe, it, expect } from 'vitest';
import { resolveBestCategory, calculateMetrics } from './stats.js';

describe('resolveBestCategory', () => {
  it('returns empty string for empty predictions', () => {
    expect(resolveBestCategory([])).toBe('');
  });

  it('majority vote (unweighted)', () => {
    const predictions = [
      { category: 'A' },
      { category: 'B' },
      { category: 'A' },
    ];
    expect(resolveBestCategory(predictions, false)).toBe('A');
  });

  it('weighted averages', () => {
    const predictions = [
      { category: 'A', score: 0.8 },
      { category: 'B', score: 0.9 },
      { category: 'A', score: 0.7 },
    ];
    // A: (0.8 + 0.7) / 2 = 0.75
    // B: 0.9 / 1 = 0.9
    expect(resolveBestCategory(predictions, true)).toBe('B');
  });
});

describe('calculateMetrics', () => {
  it('calculates correct metrics for valid input', () => {
    const predictions = [
      { category: 'A', confidence: 0.8 },
      { category: 'B', confidence: 0.6 },
    ];
    const actuals = [{ category: 'A' }, { category: 'A' }];

    const metrics = calculateMetrics(predictions, actuals);

    expect(metrics.totalPredictions).toBe(2);
    expect(metrics.correctPredictions).toBe(1);
    expect(metrics.accuracy).toBe(0.5);
    expect(metrics.avgConfidence).toBe(0.7);
    expect(metrics.categoryMetrics['A'].predicted).toBe(1);
    expect(metrics.categoryMetrics['A'].actual).toBe(2);
    expect(metrics.categoryMetrics['A'].correct).toBe(1);
    expect(metrics.categoryMetrics['B'].predicted).toBe(1);
  });

  it('throws error for mismatched lengths', () => {
    expect(() => {
      calculateMetrics([{}], []);
    }).toThrow(/Invalid input/);
  });

  it('handles empty arrays', () => {
    const metrics = calculateMetrics([], []);
    expect(metrics.totalPredictions).toBe(0);
    expect(metrics.accuracy).toBe(0);
  });
});
