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
  logger.info(`Creating uploads directory: ${uploadsDir}`);
  fs.mkdirSync(uploadsDir, { recursive: true });
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
        const filePath = path.resolve(path.join(dataDir, file));
        const stats = fs.statSync(filePath);
        logger.info(`Found JSON file: ${file} (${stats.size} bytes, modified: ${stats.mtime})`);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime
        };
      });

    logger.info(`Found ${files.length} JSON files`);
    res.json(files);
  } catch (error) {
    logger.error(`Error reading JSON files: ${error.message}`);
    res.status(500).json({ error: 'Error reading JSON files', details: error.message });
  }
});

// Delete a file
app.post('/api/files/delete', (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      logger.error('No file path provided in delete request');
      return res.status(400).json({ error: 'File path is required' });
    }
    
    // Security check: only allow deleting files from the data directory
    if (!filePath.includes(dataDir)) {
      logger.error(`Security violation - attempted to delete file outside data directory: ${filePath}`);
      return res.status(403).json({ error: 'Cannot delete files outside of data directory' });
    }
    
    if (!fs.existsSync(filePath)) {
      logger.error(`File does not exist: ${filePath}`);
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if it's a JSON file
    if (!filePath.endsWith('.json')) {
      logger.error(`Not a JSON file: ${filePath}`);
      return res.status(400).json({ error: 'Only JSON files can be deleted using this endpoint' });
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    logger.info(`Successfully deleted file: ${filePath}`);
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`);
    res.status(500).json({ error: 'Error deleting file', details: error.message });
  }
});

// Rename a file
app.post('/api/files/rename', (req, res) => {
  try {
    const { oldPath, newName } = req.body;
    
    if (!oldPath || !newName) {
      logger.error('Missing parameters in rename request');
      return res.status(400).json({ error: 'Old path and new name are required' });
    }
    
    // Security check: only allow renaming files in the data directory
    if (!oldPath.includes(dataDir)) {
      logger.error(`Security violation - attempted to rename file outside data directory: ${oldPath}`);
      return res.status(403).json({ error: 'Cannot rename files outside of data directory' });
    }
    
    if (!fs.existsSync(oldPath)) {
      logger.error(`File does not exist: ${oldPath}`);
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check if it's a JSON file
    if (!oldPath.endsWith('.json')) {
      logger.error(`Not a JSON file: ${oldPath}`);
      return res.status(400).json({ error: 'Only JSON files can be renamed using this endpoint' });
    }
    
    // Ensure newName has .json extension
    const formattedNewName = newName.endsWith('.json') ? newName : `${newName}.json`;
    
    // Create new path with the same directory but new filename
    const dirName = path.dirname(oldPath);
    const newPath = path.join(dirName, formattedNewName);
    
    // Check if the destination file already exists
    if (fs.existsSync(newPath) && oldPath !== newPath) {
      logger.error(`Destination file already exists: ${newPath}`);
      return res.status(409).json({ error: 'A file with that name already exists' });
    }
    
    // Rename the file
    fs.renameSync(oldPath, newPath);
    logger.info(`Successfully renamed file from ${oldPath} to ${newPath}`);
    
    res.json({ 
      success: true, 
      message: 'File renamed successfully', 
      oldPath: oldPath,
      newPath: newPath,
      newName: formattedNewName
    });
  } catch (error) {
    logger.error(`Error renaming file: ${error.message}`);
    res.status(500).json({ error: 'Error renaming file', details: error.message });
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
        const filePath = path.resolve(path.join(dataDir, file));
        const stats = fs.statSync(filePath);
        logger.info(`Found CSV file: ${file} (${stats.size} bytes, modified: ${stats.mtime})`);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime
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
      logger.error('No file provided in upload request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = path.join(uploadsDir, req.file.filename);
    logger.info(`Processing uploaded file: ${filePath} (${req.file.size} bytes)`);

    try {
      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`Uploaded file not found at ${filePath}`);
      }
      
      // Ensure the data directory exists
      if (!fs.existsSync(dataDir)) {
        logger.info(`Creating data directory: ${dataDir}`);
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Process the CSV file and create embeddings
      logger.info('Starting embedding creation process...');
      const embeddingPath = await csvEmbedding(filePath);
      
      // Double-check embedding.json was created and has content
      if (!fs.existsSync(embeddingPath)) {
        throw new Error(`Embedding file was not created at ${embeddingPath}`);
      }
      
      const stats = fs.statSync(embeddingPath);
      if (stats.size === 0) {
        throw new Error(`Embedding file was created but is empty: ${embeddingPath}`);
      }
      
      logger.info(`Embedding file successfully created: ${embeddingPath} (${stats.size} bytes)`);
      
      // List the generated files for debugging
      logger.info('Files in data directory after processing:');
      const dataFiles = fs.readdirSync(dataDir);
      dataFiles.forEach(file => {
        const fileStats = fs.statSync(path.join(dataDir, file));
        logger.info(`- ${file} (${fileStats.size} bytes, modified: ${fileStats.mtime})`);
      });

      res.json({ 
        success: true,
        message: 'File processed successfully. Embeddings have been created.',
        embeddingPath: embeddingPath,
        fileSize: stats.size,
        lastModified: stats.mtime
      });

      // Clean up uploaded file
      fs.unlinkSync(filePath);
      logger.info(`Cleaned up uploaded file: ${filePath}`);
    } catch (error) {
      logger.error(`Error processing file: ${error.message}`);
      logger.error(error.stack);
      
      // If file still exists, try to clean it up
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          logger.info(`Cleaned up uploaded file after error: ${filePath}`);
        } catch (cleanupErr) {
          logger.error(`Failed to clean up file: ${cleanupErr.message}`);
        }
      }
      
      throw error;
    }
  } catch (error) {
    logger.error(`Error in upload handler: ${error.message}`);
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
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