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
  CardContent,
  Checkbox,
  ListItemIcon
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
  Error as ErrorIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [editingFile, setEditingFile] = useState(null);
  const [editFileName, setEditFileName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [fileToRename, setFileToRename] = useState(null);
  
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
  
  // Delete multiple datasets
  const deleteSelectedDatasets = async () => {
    if (selectedFiles.length === 0) {
      setManageStatus({
        show: true,
        message: 'No files selected for deletion',
        severity: 'warning'
      });
      return;
    }
    
    try {
      setManageStatus({
        show: true,
        message: `Deleting ${selectedFiles.length} file(s)...`,
        severity: 'info'
      });
      setLoading(true);
      
      for (const filePath of selectedFiles) {
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
        
        await response.json();
      }
      
      setManageStatus({
        show: true,
        message: `Successfully deleted ${selectedFiles.length} file(s)`,
        severity: 'success'
      });
      
      // Reset selection and reload datasets
      setSelectedFiles([]);
      await loadEmbeddingFiles();
    } catch (error) {
      console.error('Error deleting datasets:', error);
      setManageStatus({
        show: true,
        message: `Error deleting files: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Rename a dataset
  const renameDataset = async (filePath, newName) => {
    // Ensure newName has .json extension
    if (!newName) {
      setManageStatus({
        show: true,
        message: 'Please provide a new name',
        severity: 'warning'
      });
      return;
    }
    
    // Ensure the filename has .json extension
    const formattedNewName = newName.endsWith('.json') ? newName : `${newName}.json`;
    
    try {
      setManageStatus({
        show: true,
        message: `Renaming file...`,
        severity: 'info'
      });
      setLoading(true);
      
      // This would need a backend endpoint for renaming files
      // For now this is a placeholder - you would need to implement the rename API
      const response = await fetch('http://localhost:3001/api/files/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPath: filePath,
          newName: formattedNewName
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await response.json();
      
      setManageStatus({
        show: true,
        message: `Successfully renamed file to ${formattedNewName}`,
        severity: 'success'
      });
      
      // Reset and reload
      setEditingFile(null);
      setEditFileName('');
      await loadEmbeddingFiles();
    } catch (error) {
      console.error('Error renaming dataset:', error);
      setManageStatus({
        show: true,
        message: `Error renaming file: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle selection of files for deletion
  const handleToggleSelect = (filePath) => {
    setSelectedFiles(prev => {
      if (prev.includes(filePath)) {
        return prev.filter(path => path !== filePath);
      } else {
        return [...prev, filePath];
      }
    });
  };
  
  // Start editing a file name
  const startEditing = (file) => {
    setEditingFile(file.path);
    // Remove .json extension for editing but keep it stored internally
    setEditFileName(file.name.replace(/\.json$/, ''));
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingFile(null);
    setEditFileName('');
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
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mt: 2 }}>
      <Paper elevation={3} sx={{ my: 2, p: 3, flex: 1 }}>
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

      {/* Manage Datasets Panel */}
      <Card sx={{ flex: 1, my: 2 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            <DatasetIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Manage Embeddings
          </Typography>
          
          {manageStatus.show && (
            <Alert severity={manageStatus.severity} sx={{ mb: 2 }}>
              {manageStatus.message}
            </Alert>
          )}
          
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="error" 
              disabled={loading || selectedFiles.length === 0}
              onClick={deleteSelectedDatasets}
              startIcon={<DeleteIcon />}
              size="small"
            >
              Delete Selected
            </Button>
            <Typography variant="body2" sx={{ lineHeight: '30px' }}>
              {selectedFiles.length} file(s) selected
            </Typography>
          </Box>
          
          <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
            {embeddingFiles.length === 0 ? (
              <ListItem>
                <ListItemText primary="No datasets available" />
              </ListItem>
            ) : (
              embeddingFiles.map((file, index) => {
                const isSelected = selectedFiles.includes(file.path);
                const isEditing = editingFile === file.path;
                
                return (
                  <React.Fragment key={file.path}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(file.path)}
                          disabled={loading}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      
                      {isEditing ? (
                        <TextField
                          value={editFileName}
                          onChange={(e) => setEditFileName(e.target.value)}
                          variant="standard"
                          autoFocus
                          fullWidth
                          sx={{ mr: 6 }}
                          disabled={loading}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && editFileName.trim()) {
                              renameDataset(file.path, editFileName);
                            }
                          }}
                          helperText=".json will be added automatically"
                          placeholder="Enter file name without extension"
                        />
                      ) : (
                        <ListItemText 
                          primary={file.name} 
                          secondary={`Modified: ${new Date(file.modified).toLocaleString()}`} 
                        />
                      )}
                      
                      <ListItemSecondaryAction>
                        {isEditing ? (
                          <>
                            <IconButton 
                              edge="end" 
                              aria-label="save"
                              onClick={() => renameDataset(file.path, editFileName)}
                              disabled={loading || !editFileName.trim()}
                              color="primary"
                              sx={{ mr: 1 }}
                            >
                              <SaveIcon />
                            </IconButton>
                            <IconButton 
                              edge="end" 
                              aria-label="cancel"
                              onClick={cancelEditing}
                              disabled={loading}
                            >
                              <CancelIcon />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton 
                              edge="end" 
                              aria-label="edit"
                              onClick={() => startEditing(file)}
                              disabled={loading || isEditing}
                              color="primary"
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              edge="end" 
                              aria-label="delete"
                              onClick={() => deleteDataset(file.path, file.name)}
                              disabled={loading}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                );
              })
            )}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
  
  // Evaluate Tab (renamed from Manage & Evaluate Tab)
  const renderManageEvaluateTab = () => (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mt: 2 }}>
      {/* Evaluate Panel */}
      <Card sx={{ flex: 1, height: 'fit-content' }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            <ChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Evaluate Embeddings
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
        </CardContent>
      </Card>

      {/* Results Panel - always present */}
      <Card sx={{ flex: 2 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Evaluation Results
          </Typography>
          {!evaluationResults && (
            <Box 
              sx={{ 
                mt: 2,
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                backgroundColor: 'background.default',
                borderRadius: 1
              }}
            >
              <Typography variant="body1" color="text.secondary" align="center">
                Select a model and click "Evaluate" to see results
              </Typography>
            </Box>
          )}
          {evaluationResults && (
            <Box 
              sx={{ 
                mt: 2, 
                p: 2, 
                maxHeight: 600, 
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
            <Tab icon={<UploadIcon />} label="Create and Manage" />
            <Tab icon={<SettingsIcon />} label="Evaluate" />
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