import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import csvEmbedding from './commands/csv-embedding.js';
import { embeddingClassification } from './commands/embedding-classification.js';
import logger from './utils/logger.js';

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

    const outputFile = path.join(dataDir, 'predicted.csv');
    const resultMetrics = true;
    const evaluateModel = true;

    await embeddingClassification(
      unclassifiedFile || null,
      embeddingFile,
      outputFile,
      resultMetrics,
      evaluateModel
    );

    // Read the evaluation results
    const evaluationResults = fs.readFileSync(outputFile, 'utf-8');
    
    res.json({ 
      success: true, 
      message: 'Classification completed successfully',
      results: evaluationResults
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