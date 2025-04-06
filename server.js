import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import csvEmbedding from './commands/csv-embedding.js';
import { embeddingClassification } from './commands/embedding-classification.js';
import logger from './utils/logger.js';
import { rankSamplesBySimilarity } from './utils/embedding.js';
import { resolveBestCategory, calculateMetrics } from './utils/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Parse JSON request bodies
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter
});

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Serve static files from the dist directory
app.use(express.static('dist'));

// Get list of JSON files in data directory
app.get('/api/files/json', (req, res) => {
  try {
    logger.info(`Reading JSON files from directory: ${dataDir}`);
    
    if (!fs.existsSync(dataDir)) {
      logger.error(`Data directory does not exist: ${dataDir}`);
      return res.status(404).json({ error: 'Data directory not found' });
    }

    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(dataDir, file);
        logger.info(`Found JSON file: ${file}`);
        return {
          name: file,
          path: filePath
        };
      });

    logger.info(`Found ${files.length} JSON files`);
    res.json(files);
  } catch (error) {
    logger.error(`Error reading JSON files: ${error.message}`);
    res.status(500).json({ error: 'Error reading JSON files', details: error.message });
  }
});

// Get list of CSV files in data directory
app.get('/api/files/csv', (req, res) => {
  try {
    logger.info(`Reading CSV files from directory: ${dataDir}`);
    
    if (!fs.existsSync(dataDir)) {
      logger.error(`Data directory does not exist: ${dataDir}`);
      return res.status(404).json({ error: 'Data directory not found' });
    }

    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.csv'))
      .map(file => {
        const filePath = path.join(dataDir, file);
        logger.info(`Found CSV file: ${file}`);
        return {
          name: file,
          path: filePath
        };
      });

    logger.info(`Found ${files.length} CSV files`);
    res.json(files);
  } catch (error) {
    logger.error(`Error reading CSV files: ${error.message}`);
    res.status(500).json({ error: 'Error reading CSV files', details: error.message });
  }
});

// Endpoint to get classified data from output CSV
app.post('/api/classified-data', async (req, res) => {
  try {
    const { outputFile } = req.body;
    
    if (!outputFile) {
      return res.status(400).json({ error: 'Output file parameter is required' });
    }
    
    const filePath = path.join(dataDir, outputFile);
    logger.info(`Reading classified data from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      logger.error(`File does not exist: ${filePath}`);
      return res.status(404).json({ error: 'Output file not found' });
    }
    
    // Import the CSV parsing utility
    const { parseCsvToJson } = await import('./utils/csv.js');
    
    // Parse the CSV file
    const jsonData = await parseCsvToJson(filePath);
    logger.info(`Parsed ${jsonData.length} rows from output file`);
    
    res.json(jsonData);
  } catch (error) {
    logger.error(`Error reading classified data: ${error.message}`);
    res.status(500).json({ error: 'Error reading classified data', details: error.message });
  }
});

// Handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = path.join(uploadsDir, req.file.filename);
    logger.info(`Processing file: ${filePath}`);

    await csvEmbedding(filePath);

    // Verify embedding.json was created
    const embeddingPath = path.join(dataDir, 'embedding.json');
    if (!fs.existsSync(embeddingPath)) {
      throw new Error('Failed to create embedding.json');
    }

    res.json({ 
      success: true,
      message: 'File processed successfully. Embeddings have been created.',
      embeddingPath: embeddingPath
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);
  } catch (error) {
    logger.error(`Error processing file: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Handle classification request
app.post('/api/classify', async (req, res) => {
  try {
    const { embeddingFile, unclassifiedFile } = req.body;
    
    if (!embeddingFile) {
      return res.status(400).json({ error: 'Embedding file is required' });
    }

    // For evaluation-only mode (no prediction), we don't need an unclassified file
    const outputFile = path.join(dataDir, 'predicted.csv');
    const resultMetrics = true;
    const evaluateModel = true;
    
    let jsonData;
    try {
      const jsonFile = await fs.promises.readFile(embeddingFile, 'utf-8');
      jsonData = JSON.parse(jsonFile);
      logger.info(`Fetching ${jsonData.length} samples from comparison set`);
    } catch (err) {
      logger.error(`Failed to read or parse comparison file: ${err.message}`);
      throw err;
    }

    // Randomize the embedding array
    const shuffle = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const comparisonPercentage = 80;
    const randomizedEmbeddingArray = shuffle([...jsonData]);
    const originalEmbeddingLength = randomizedEmbeddingArray.length;
    const majorityIndex = Math.round(
      originalEmbeddingLength * (comparisonPercentage / 100)
    );

    const comparisonData = randomizedEmbeddingArray.slice(0, majorityIndex);
    logger.info(
      `Reserving ${comparisonPercentage}% (${comparisonData.length}) of original dataset to compare.`
    );

    // Run evaluation
    let evaluationResults = null;
    
    if (evaluateModel) {
      const evaluateData = randomizedEmbeddingArray.slice(majorityIndex);
      logger.info(
        `Starting model evaluation preview using remaining ${100 - comparisonPercentage}% (${evaluateData.length}) of samples.`
      );

      // Process evaluation in chunks to prevent memory issues
      const chunkSize = 100;
      const results = [];
      
      for (let i = 0; i < evaluateData.length; i += chunkSize) {
        const chunk = evaluateData.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(
          chunk.map(async (item) => {
            const searchResults = await rankSamplesBySimilarity(
              item.text,
              comparisonData,
              40, // maxSamplesToSearch
              30  // similarityThresholdPercent
            );
            const predictedCategory = resolveBestCategory(searchResults, true) || '???';
            const confidence = searchResults[0]?.score || 0;

            return {
              text: item.text,
              category: predictedCategory,
              confidence,
              actualCategory: item.category,
            };
          })
        );
        results.push(...chunkResults);
      }

      const metrics = calculateMetrics(results, evaluateData);
      evaluationResults = {
        totalPredictions: metrics.totalPredictions,
        correctPredictions: metrics.correctPredictions,
        accuracy: metrics.accuracy,
        avgConfidence: metrics.avgConfidence,
        categoryMetrics: metrics.categoryMetrics
      };

      // Log evaluation results
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

    // Only process unclassified input if a file was provided and it's a valid path
    if (unclassifiedFile && typeof unclassifiedFile === 'string') {
      try {
        await embeddingClassification(
          unclassifiedFile,
          embeddingFile,
          outputFile,
          resultMetrics,
          false // Don't run evaluation again
        );
      } catch (error) {
        logger.error(`Error processing unclassified file: ${error.message}`);
        // Don't fail the whole request - just log the error
      }
    }

    res.json({ 
      success: true, 
      message: 'Evaluation completed successfully',
      evaluationResults: evaluationResults
    });
  } catch (error) {
    logger.error(`Error during classification: ${error.message}`);
    res.status(500).json({ 
      error: 'Error during classification', 
      details: error.message 
    });
  }
});

// Start the server
app.listen(port, () => {
  logger.info(`API server running at http://localhost:${port}`);
});

export default app; 