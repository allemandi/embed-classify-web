import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  Tabs,
  Tab,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  useMediaQuery,
  Card,
  CardContent
} from '@mui/material';

// Import icons
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  BarChart as ChartIcon,
  Category as CategoryIcon,
  Dataset as DatasetIcon,
  Settings as SettingsIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

// App component
const App = () => {
  // Theme state
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState('dark');
  const [currentTab, setCurrentTab] = useState(0);
  
  // App state
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ show: false, message: '', severity: 'info' });
  const [evaluateStatus, setEvaluateStatus] = useState({ show: false, message: '', severity: 'info' });
  const [classifyStatus, setClassifyStatus] = useState({ show: false, message: '', severity: 'info' });
  const [manageStatus, setManageStatus] = useState({ show: false, message: '', severity: 'info' });
  const [loading, setLoading] = useState(false);
  
  // Data state
  const [embeddingFiles, setEmbeddingFiles] = useState([]);
  const [csvFiles, setCsvFiles] = useState([]);
  const [selectedEvaluationModel, setSelectedEvaluationModel] = useState('');
  const [selectedClassificationModel, setSelectedClassificationModel] = useState('');
  const [selectedCsvFile, setSelectedCsvFile] = useState('');
  const [evaluationResults, setEvaluationResults] = useState('');
  const [classificationResults, setClassificationResults] = useState([]);
  
  // Create dynamic theme
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#90caf9' : '#1976d2',
          },
          secondary: {
            main: mode === 'dark' ? '#f48fb1' : '#dc004e',
          },
          background: {
            default: mode === 'dark' ? '#121212' : '#f5f5f5',
            paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
        components: {
          MuiTableCell: {
            styleOverrides: {
              head: {
                fontWeight: 'bold',
                backgroundColor: mode === 'dark' ? '#333' : '#f0f0f0',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                padding: '16px 24px',
              },
            },
          },
        },
      }),
    [mode],
  );
  
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };
  
  useEffect(() => {
    // Initial data loading
    loadEmbeddingFiles();
    loadCsvFiles();
  }, []);
  
  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // API functions
  
  // Load embedding files from server
  const loadEmbeddingFiles = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/files/json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const files = await response.json();
      setEmbeddingFiles(files);
    } catch (error) {
      console.error('Error loading JSON files:', error);
      setManageStatus({
        show: true,
        message: `Error loading JSON files: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  // Load CSV files from server
  const loadCsvFiles = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/files/csv');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const files = await response.json();
      setCsvFiles(files);
    } catch (error) {
      console.error('Error loading CSV files:', error);
    }
  };
  
  // Delete a dataset
  const deleteDataset = async (filePath, fileName) => {
    try {
      setManageStatus({
        show: true,
        message: `Deleting ${fileName}...`,
        severity: 'info'
      });
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/files/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Delete response:', result);
      
      setManageStatus({
        show: true,
        message: `Successfully deleted ${fileName}`,
        severity: 'success'
      });
      
      // Reload datasets and dropdowns
      await loadEmbeddingFiles();
    } catch (error) {
      console.error('Error deleting dataset:', error);
      setManageStatus({
        show: true,
        message: `Error deleting ${fileName}: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file upload
  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setFileToUpload(file);
    } else {
      setUploadStatus({
        show: true,
        message: 'Please select a CSV file',
        severity: 'error'
      });
    }
  };
  
  const handleUploadFile = async () => {
    if (!fileToUpload) {
      setUploadStatus({
        show: true,
        message: 'Please select a file first',
        severity: 'error'
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('file', fileToUpload);
    
    try {
      setUploadStatus({
        show: true,
        message: 'Uploading and processing file... (this might take a while)',
        severity: 'info'
      });
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Upload response:', result);
      
      setUploadStatus({
        show: true,
        message: result.message,
        severity: 'success'
      });
      
      // Reset form
      setFileToUpload(null);
      document.getElementById('file-upload').value = '';
      
      // Wait briefly to ensure files are fully saved to disk
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload file lists
      await loadEmbeddingFiles();
      await loadCsvFiles();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        show: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle model evaluation
  const handleEvaluateModel = async () => {
    if (!selectedEvaluationModel) {
      setEvaluateStatus({
        show: true,
        message: 'Please select an embedding file',
        severity: 'error'
      });
      return;
    }
    
    try {
      setEvaluateStatus({
        show: true,
        message: 'Processing evaluation...',
        severity: 'info'
      });
      setLoading(true);
      setEvaluationResults('');
      
      console.log('Sending evaluation request to server...');
      const response = await fetch('http://localhost:3001/api/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeddingFile: selectedEvaluationModel,
          unclassifiedFile: null,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Received evaluation result:', result);
      
      setEvaluateStatus({
        show: true,
        message: result.message,
        severity: 'success'
      });
      
      if (result.evaluationResults) {
        // Format and display the evaluation results
        const metrics = result.evaluationResults;
        let resultsText = '=== Model Evaluation Results ===\n\n';
        resultsText += `Total Test Samples: ${metrics.totalPredictions}\n`;
        resultsText += `Correct Predictions: ${metrics.correctPredictions}\n`;
        resultsText += `Overall Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%\n`;
        resultsText += `Average Confidence: ${(metrics.avgConfidence * 100).toFixed(2)}%\n\n`;
        
        resultsText += '=== Category-wise Performance ===\n\n';
        Object.entries(metrics.categoryMetrics).forEach(([category, stats]) => {
          resultsText += `\nCategory: ${category}\n`;
          resultsText += `├─ Predictions: ${stats.predicted}\n`;
          resultsText += `├─ Correct: ${stats.correct}\n`;
          resultsText += `├─ Actual Occurrences: ${stats.actual}\n`;
          
          const categoryPrecision = stats.predicted > 0
            ? ((stats.correct / stats.predicted) * 100).toFixed(2)
            : '0.00';
          const categoryRecall = stats.actual > 0
            ? ((stats.correct / stats.actual) * 100).toFixed(2)
            : '0.00';
            
          resultsText += `├─ Precision: ${categoryPrecision}%\n`;
          resultsText += `└─ Recall: ${categoryRecall}%\n`;
        });
        
        setEvaluationResults(resultsText);
      } else {
        console.warn('No evaluation results received from server');
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      setEvaluateStatus({
        show: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle data classification
  const handleClassifyData = async () => {
    if (!selectedClassificationModel) {
      setClassifyStatus({
        show: true,
        message: 'Please select an embedding file',
        severity: 'error'
      });
      return;
    }
    
    if (!selectedCsvFile) {
      setClassifyStatus({
        show: true,
        message: 'Please select an unclassified file to classify',
        severity: 'error'
      });
      return;
    }
    
    try {
      setClassifyStatus({
        show: true,
        message: 'Processing classification...',
        severity: 'info'
      });
      setLoading(true);
      setClassificationResults([]);
      
      console.log('Sending classification request to server...');
      const response = await fetch('http://localhost:3001/api/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeddingFile: selectedClassificationModel,
          unclassifiedFile: selectedCsvFile,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Received classification result:', result);
      
      setClassifyStatus({
        show: true,
        message: 'Classification completed successfully. Fetching results...',
        severity: 'success'
      });
      
      // Fetch the classified data from predicted.csv
      try {
        const csvResponse = await fetch('http://localhost:3001/api/classified-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            outputFile: 'predicted.csv'
          }),
        });
        
        if (!csvResponse.ok) {
          throw new Error(`Failed to fetch classification results: ${csvResponse.status}`);
        }
        
        const csvData = await csvResponse.json();
        console.log('Classification results:', csvData);
        
        if (csvData && csvData.length > 0) {
          setClassificationResults(csvData);
          setClassifyStatus({
            show: true,
            message: 'Classification completed successfully.',
            severity: 'success'
          });
        } else {
          setClassifyStatus({
            show: true,
            message: 'Classification completed but no results were returned.',
            severity: 'warning'
          });
        }
      } catch (error) {
        console.error('Error fetching classification results:', error);
        setClassifyStatus({
          show: true,
          message: `Error fetching results: ${error.message}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Classification error:', error);
      setClassifyStatus({
        show: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Render tab panels
  
  // Create Embeddings Tab
  const renderCreateEmbeddingsTab = () => (
    <Paper elevation={3} sx={{ my: 2, p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        <UploadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Create Embeddings
      </Typography>
      
      <Box sx={{ mt: 3, p: 2, border: '2px dashed', borderColor: 'primary.main', borderRadius: 2, textAlign: 'center' }}>
        <input
          accept=".csv"
          style={{ display: 'none' }}
          id="file-upload"
          type="file"
          onChange={handleFileSelected}
        />
        <label htmlFor="file-upload">
          <Button 
            variant="contained" 
            component="span" 
            startIcon={<UploadIcon />}
            fullWidth
          >
            Choose CSV File
          </Button>
        </label>
        
        {fileToUpload && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Selected file: {fileToUpload.name}
          </Typography>
        )}
      </Box>
      
      <Button
        variant="contained"
        color="primary"
        disabled={!fileToUpload || loading}
        onClick={handleUploadFile}
        fullWidth
        sx={{ mt: 2 }}
        startIcon={loading ? <CircularProgress size={24} /> : null}
      >
        {loading ? 'Processing...' : 'Upload and Process'}
      </Button>
      
      {uploadStatus.show && (
        <Alert severity={uploadStatus.severity} sx={{ mt: 2 }}>
          {uploadStatus.message}
        </Alert>
      )}
    </Paper>
  );
  
  // Manage & Evaluate Tab
  const renderManageEvaluateTab = () => (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mt: 2 }}>
      {/* Evaluate Panel */}
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            <ChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Evaluate Model
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="evaluation-model-label">Select Embedding Model</InputLabel>
            <Select
              labelId="evaluation-model-label"
              value={selectedEvaluationModel}
              onChange={(e) => setSelectedEvaluationModel(e.target.value)}
              label="Select Embedding Model"
              disabled={loading}
            >
              <MenuItem value="">
                <em>Select a model...</em>
              </MenuItem>
              {embeddingFiles.map((file) => (
                <MenuItem key={file.path} value={file.path}>
                  {file.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            color="primary"
            disabled={!selectedEvaluationModel || loading}
            onClick={handleEvaluateModel}
            fullWidth
            sx={{ mt: 2 }}
            startIcon={loading ? <CircularProgress size={24} /> : <ChartIcon />}
          >
            {loading ? 'Evaluating...' : 'Evaluate'}
          </Button>
          
          {evaluateStatus.show && (
            <Alert severity={evaluateStatus.severity} sx={{ mt: 2 }}>
              {evaluateStatus.message}
            </Alert>
          )}
          
          {evaluationResults && (
            <Box 
              sx={{ 
                mt: 2, 
                p: 2, 
                maxHeight: 400, 
                overflow: 'auto', 
                backgroundColor: 'background.default',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                borderRadius: 1
              }}
            >
              {evaluationResults}
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Manage Datasets Panel */}
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            <DatasetIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Manage Datasets
          </Typography>
          
          {manageStatus.show && (
            <Alert severity={manageStatus.severity} sx={{ mb: 2 }}>
              {manageStatus.message}
            </Alert>
          )}
          
          <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
            {embeddingFiles.length === 0 ? (
              <ListItem>
                <ListItemText primary="No datasets available" />
              </ListItem>
            ) : (
              embeddingFiles.map((file, index) => (
                <React.Fragment key={file.path}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText 
                      primary={file.name} 
                      secondary={`Modified: ${new Date(file.modified).toLocaleString()}`} 
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => deleteDataset(file.path, file.name)}
                        disabled={loading}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))
            )}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
  
  // Classify Tab
  const renderClassifyTab = () => (
    <Paper elevation={3} sx={{ my: 2, p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Classify Data
      </Typography>
      
      <Box sx={{ mt: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="classification-model-label">Select Embedding Model</InputLabel>
          <Select
            labelId="classification-model-label"
            value={selectedClassificationModel}
            onChange={(e) => setSelectedClassificationModel(e.target.value)}
            label="Select Embedding Model"
            disabled={loading}
          >
            <MenuItem value="">
              <em>Select a model...</em>
            </MenuItem>
            {embeddingFiles.map((file) => (
              <MenuItem key={file.path} value={file.path}>
                {file.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="unclassified-file-label">Select Unclassified CSV</InputLabel>
          <Select
            labelId="unclassified-file-label"
            value={selectedCsvFile}
            onChange={(e) => setSelectedCsvFile(e.target.value)}
            label="Select Unclassified CSV"
            disabled={loading}
          >
            <MenuItem value="">
              <em>Select a CSV file...</em>
            </MenuItem>
            {csvFiles.map((file) => (
              <MenuItem key={file.path} value={file.path}>
                {file.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="contained"
          color="success"
          disabled={!selectedClassificationModel || !selectedCsvFile || loading}
          onClick={handleClassifyData}
          fullWidth
          sx={{ mt: 2 }}
          startIcon={loading ? <CircularProgress size={24} /> : <CategoryIcon />}
        >
          {loading ? 'Classifying...' : 'Classify Data'}
        </Button>
      </Box>
      
      {classifyStatus.show && (
        <Alert severity={classifyStatus.severity} sx={{ mt: 2, mb: 3 }}>
          {classifyStatus.message}
        </Alert>
      )}
      
      {classificationResults.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Classification Results
          </Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="classification results table" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Comment</TableCell>
                  <TableCell align="right">Cosine Score</TableCell>
                  <TableCell align="right">Similar Samples</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classificationResults.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell component="th" scope="row">
                      {row.category || 'Unknown'}
                    </TableCell>
                    <TableCell>{row.comment}</TableCell>
                    <TableCell align="right">{row.nearest_cosine_score ? `${row.nearest_cosine_score}%` : 'N/A'}</TableCell>
                    <TableCell align="right">{row.similar_samples_count || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box id="app-container">
        <AppBar position="sticky">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              embed-classify-web
            </Typography>
            <IconButton color="inherit" onClick={toggleColorMode} sx={{ ml: 1 }}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Toolbar>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange} 
            variant="fullWidth"
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab icon={<UploadIcon />} label="Create" />
            <Tab icon={<SettingsIcon />} label="Manage & Evaluate" />
            <Tab icon={<CategoryIcon />} label="Classify" />
          </Tabs>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
          {currentTab === 0 && renderCreateEmbeddingsTab()}
          {currentTab === 1 && renderManageEvaluateTab()}
          {currentTab === 2 && renderClassifyTab()}
        </Container>
        
        <Box component="footer" sx={{ p: 2, textAlign: 'center', bgcolor: 'background.paper' }}>
          <Typography variant="body2" color="text.secondary">
            embed-classify-web © {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

// Render the app
const container = document.getElementById('app-container');
const root = createRoot(container);
root.render(<App />); 