import csv from 'csvtojson';
import path from 'path';
import { pipeline } from '@xenova/transformers';
import logger from './logger.js';

// Initialize the pipeline outside of the function to avoid reloading on each call
let embeddingExtractor = null;

// Initialize the model asynchronously
const initializeModel = async () => {
  if (!embeddingExtractor) {
    logger.info('Initializing the embedding model (Xenova/all-MiniLM-L6-v2)...');
    try {
      embeddingExtractor = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      logger.info('Embedding model initialized successfully');
    } catch (error) {
      logger.error(`Error initializing embedding model: ${error.message}`);
      logger.error(error.stack);
      throw error;
    }
  }
  return embeddingExtractor;
};

const createEmbeddings = async (textArr) => {
  if (!Array.isArray(textArr) || textArr.length === 0) {
    throw new Error('Input must be a non-empty array of strings');
  }
  
  logger.info(`Creating embeddings for ${textArr.length} text items`);
  
  try {
    // Initialize the model if not already done
    const extractor = await initializeModel();
    
    if (!extractor) {
      throw new Error('Failed to initialize embedding model');
    }
    
    logger.info('Running embedding extraction...');
    const embedding = await extractor(textArr, {
      pooling: 'mean',
      normalize: true,
    });

    if (!embedding) {
      throw new Error('No embedding generated from the model');
    }

    const embeddingOutput = embedding.tolist();

    if (!Array.isArray(embeddingOutput) || embeddingOutput.length === 0) {
      throw new Error('Invalid embedding output from model');
    }
    
    logger.info(`Successfully created embeddings for ${embeddingOutput.length} items`);

    return textArr.map((text, i) => ({
      text,
      embedding: embeddingOutput[i],
    }));
  } catch (error) {
    logger.error(`Error creating embeddings: ${error.message}`);
    logger.error(error.stack);
    
    // Instead of returning empty embeddings, throw the error to properly handle it upstream
    throw new Error(`Failed to create embeddings: ${error.message}`);
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
    logger.error(`Error ranking samples by similarity: ${error.message}`);
    logger.error(error.stack);
    return [];
  }
};

// Initialize the model when the module is loaded
initializeModel().catch(err => {
  logger.error(`Failed to initialize model on startup: ${err.message}`);
});

export { createEmbeddings, rankSamplesBySimilarity };
