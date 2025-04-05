const csv = require('csvtojson');
const path = require('path');
const { pipeline } = require('@xenova/transformers');
const logger = require('./logger');

const createEmbeddings = async (textArr) => {
  if (!Array.isArray(textArr) || textArr.length === 0) {
    throw new Error('Input must be a non-empty array of strings');
  }
  try {
    // Cache the pipeline instance
    if (!createEmbeddings.extractor) {
      createEmbeddings.extractor = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
    }

    const embedding = await createEmbeddings.extractor(textArr, {
      pooling: 'mean',
      normalize: true,
    });

    if (!embedding) {
      throw new Error('No embedding generated');
    }

    const embeddingOutput = embedding.tolist();

    if (!Array.isArray(embeddingOutput) || embeddingOutput.length === 0) {
      throw new Error('Invalid embedding output');
    }

    return textArr.map((text, i) => ({
      text,
      embedding: embeddingOutput[i],
    }));
  } catch (error) {
    logger.error('Error creating embeddings:', error);
    return textArr.map((text) => ({
      text,
      embedding: [],
    }));
  }
};

const rankSamplesBySimilarity = async (
  searchQuery,
  samples,
  maxResults = 10,
  similarityThresholdPercent = 40
) => {
  try {
    const queryArray = Array.isArray(searchQuery) ? searchQuery : [searchQuery];
    if (!queryArray.every((query) => typeof query === 'string')) {
      throw new Error('Search query must be a string or array of strings');
    }

    const searchQueryResponse = await createEmbeddings(queryArray);
    if (!searchQueryResponse?.[0]?.embedding) {
      logger.error('No valid embedding generated for search query');
      return [];
    }

    const queryEmbedding = searchQueryResponse[0].embedding;

    // Convert percentage to decimal for comparison
    const similarityThreshold = similarityThresholdPercent / 100;

    // Pre-calculate query embedding magnitude for performance
    const queryMagnitude = Math.sqrt(
      queryEmbedding.reduce((sum, val) => sum + val * val, 0)
    );
    const rankedSamples = samples
      .map((sample) => {
        // Calculate cosine similarity more efficiently
        const dotProduct = sample.embedding.reduce(
          (sum, val, i) => sum + val * queryEmbedding[i],
          0
        );
        const sampleMagnitude = Math.sqrt(
          sample.embedding.reduce((sum, val) => sum + val * val, 0)
        );
        const similarity = dotProduct / (sampleMagnitude * queryMagnitude);

        return {
          ...sample,
          score: similarity,
        };
      })
      .filter((sample) => sample.score > similarityThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    return rankedSamples;
  } catch (error) {
    logger.error('Error ranking samples by similarity:', error);
    return [];
  }
};

module.exports = {
  createEmbeddings,
  rankSamplesBySimilarity,
};
