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
  ListItemIcon,
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
  Cancel as CancelIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

// App component
const App = () => {
  // Theme state
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState('dark');
  const [currentTab, setCurrentTab] = useState(0);

  // App state
  const [fileToUpload, setFileToUpload] = useState(null);
  const [classifyCsvToUpload, setClassifyCsvToUpload] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({
    show: false,
    message: '',
    severity: 'info',
  });
  const [evaluateStatus, setEvaluateStatus] = useState({
    show: false,
    message: '',
    severity: 'info',
  });
  const [classifyStatus, setClassifyStatus] = useState({
    show: false,
    message: '',
    severity: 'info',
  });
  const [manageStatus, setManageStatus] = useState({
    show: false,
    message: '',
    severity: 'info',
  });
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [editingFile, setEditingFile] = useState(null);
  const [editFileName, setEditFileName] = useState('');
  const [editingCsvFile, setEditingCsvFile] = useState(null);
  const [editCsvFileName, setEditCsvFileName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [fileToRename, setFileToRename] = useState(null);
  const [readmeContent, setReadmeContent] = useState('');

  // Data state
  const [embeddingFiles, setEmbeddingFiles] = useState([]);
  const [csvFiles, setCsvFiles] = useState([]);
  const [selectedEvaluationModel, setSelectedEvaluationModel] = useState('');
  const [selectedClassificationModel, setSelectedClassificationModel] =
    useState('');
  const [selectedCsvFile, setSelectedCsvFile] = useState('');
  const [evaluationResults, setEvaluationResults] = useState('');
  const [classificationResults, setClassificationResults] = useState([]);
  const [classifyCsvStatus, setClassifyCsvStatus] = useState({
    show: false,
    message: '',
    severity: 'info',
  });

  // Configuration state
  const [weightedVotes, setWeightedVotes] = useState(true);
  const [comparisonPercentage, setComparisonPercentage] = useState(80); // Default 80%
  const [maxSamplesToSearch, setMaxSamplesToSearch] = useState(40); // Default 40 samples
  const [similarityThresholdPercent, setSimilarityThresholdPercent] =
    useState(30); // Default 30%

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
    [mode]
  );

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    // Initial data loading
    loadEmbeddingFiles();
    loadCsvFiles();
    loadReadmeContent();
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
        severity: 'error',
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

  // Load README.md content
  const loadReadmeContent = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/readme');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const content = await response.text();
      setReadmeContent(content);
    } catch (error) {
      console.error('Error loading README content:', error);
      setReadmeContent(
        '# Error\nFailed to load README content. Please try again later.'
      );
    }
  };

  // Delete a dataset
  const deleteDataset = async (filePath, fileName) => {
    try {
      setManageStatus({
        show: true,
        message: `Deleting ${fileName}...`,
        severity: 'info',
      });
      setLoading(true);

      const response = await fetch('http://localhost:3001/api/files/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath,
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
        severity: 'success',
      });

      // Reload datasets and dropdowns
      await loadEmbeddingFiles();
    } catch (error) {
      console.error('Error deleting dataset:', error);
      setManageStatus({
        show: true,
        message: `Error deleting ${fileName}: ${error.message}`,
        severity: 'error',
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
        severity: 'warning',
      });
      return;
    }

    try {
      setManageStatus({
        show: true,
        message: `Deleting ${selectedFiles.length} file(s)...`,
        severity: 'info',
      });
      setLoading(true);

      for (const filePath of selectedFiles) {
        const response = await fetch('http://localhost:3001/api/files/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filePath,
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
        severity: 'success',
      });

      // Reset selection and reload datasets
      setSelectedFiles([]);
      await loadEmbeddingFiles();
    } catch (error) {
      console.error('Error deleting datasets:', error);
      setManageStatus({
        show: true,
        message: `Error deleting files: ${error.message}`,
        severity: 'error',
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
        severity: 'warning',
      });
      return;
    }

    // Ensure the filename has .json extension
    const formattedNewName = newName.endsWith('.json')
      ? newName
      : `${newName}.json`;

    try {
      setManageStatus({
        show: true,
        message: `Renaming file...`,
        severity: 'info',
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
          newName: formattedNewName,
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
        severity: 'success',
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
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle selection of files for deletion
  const handleToggleSelect = (filePath) => {
    setSelectedFiles((prev) => {
      if (prev.includes(filePath)) {
        return prev.filter((path) => path !== filePath);
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

  // Handle file upload for embeddings
  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setFileToUpload(file);
    } else {
      setUploadStatus({
        show: true,
        message: 'Please select a CSV file',
        severity: 'error',
      });
    }
  };

  // Handle file upload for classification
  const handleClassifyCsvSelected = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setClassifyCsvToUpload(file);
    } else {
      setClassifyCsvStatus({
        show: true,
        message: 'Please select a CSV file',
        severity: 'error',
      });
    }
  };

  const handleUploadFile = async () => {
    if (!fileToUpload) {
      setUploadStatus({
        show: true,
        message: 'Please select a file first',
        severity: 'error',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      setUploadStatus({
        show: true,
        message: 'Uploading and processing file... (this might take a while)',
        severity: 'info',
      });
      setLoading(true);

      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
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
        severity: 'success',
      });

      // Reset form
      setFileToUpload(null);
      document.getElementById('file-upload').value = '';

      // Wait briefly to ensure files are fully saved to disk
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reload file lists
      await loadEmbeddingFiles();
      await loadCsvFiles();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        show: true,
        message: `Error: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle upload file for classification
  const handleUploadClassifyCsv = async () => {
    if (!classifyCsvToUpload) {
      setClassifyCsvStatus({
        show: true,
        message: 'Please select a file first',
        severity: 'error',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', classifyCsvToUpload);

    try {
      setClassifyCsvStatus({
        show: true,
        message: 'Uploading CSV file...',
        severity: 'info',
      });
      setLoading(true);

      const response = await fetch('http://localhost:3001/upload-csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload CSV response:', result);

      setClassifyCsvStatus({
        show: true,
        message: result.message || 'CSV file uploaded successfully',
        severity: 'success',
      });

      // Reset form
      setClassifyCsvToUpload(null);
      document.getElementById('csv-upload').value = '';

      // Wait briefly to ensure files are fully saved to disk
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reload file lists
      await loadCsvFiles();
    } catch (error) {
      console.error('Upload CSV error:', error);
      setClassifyCsvStatus({
        show: true,
        message: `Error: ${error.message}`,
        severity: 'error',
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
        severity: 'error',
      });
      return;
    }

    try {
      setEvaluateStatus({
        show: true,
        message: 'Processing evaluation...',
        severity: 'info',
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
          config: {
            weightedVotes,
            comparisonPercentage,
            maxSamplesToSearch,
            similarityThresholdPercent,
          },
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
        severity: 'success',
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

          const categoryPrecision =
            stats.predicted > 0
              ? ((stats.correct / stats.predicted) * 100).toFixed(2)
              : '0.00';
          const categoryRecall =
            stats.actual > 0
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
        severity: 'error',
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
        severity: 'error',
      });
      return;
    }

    if (!selectedCsvFile) {
      setClassifyStatus({
        show: true,
        message: 'Please select an unclassified file to classify',
        severity: 'error',
      });
      return;
    }

    try {
      setClassifyStatus({
        show: true,
        message: 'Processing classification...',
        severity: 'info',
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
          config: {
            weightedVotes,
            comparisonPercentage,
            maxSamplesToSearch,
            similarityThresholdPercent,
          },
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
        severity: 'success',
      });

      // Fetch the classified data from predicted.csv
      try {
        const csvResponse = await fetch(
          'http://localhost:3001/api/classified-data',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              outputFile: 'predicted.csv',
            }),
          }
        );

        if (!csvResponse.ok) {
          throw new Error(
            `Failed to fetch classification results: ${csvResponse.status}`
          );
        }

        const csvData = await csvResponse.json();
        console.log('Classification results:', csvData);

        if (csvData && csvData.length > 0) {
          setClassificationResults(csvData);
          setClassifyStatus({
            show: true,
            message: 'Classification completed successfully.',
            severity: 'success',
          });
        } else {
          setClassifyStatus({
            show: true,
            message: 'Classification completed but no results were returned.',
            severity: 'warning',
          });
        }
      } catch (error) {
        console.error('Error fetching classification results:', error);
        setClassifyStatus({
          show: true,
          message: `Error fetching results: ${error.message}`,
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Classification error:', error);
      setClassifyStatus({
        show: true,
        message: `Error: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete a CSV file
  const deleteCsvFile = async (filePath, fileName) => {
    try {
      setClassifyCsvStatus({
        show: true,
        message: `Deleting ${fileName}...`,
        severity: 'info',
      });
      setLoading(true);

      const response = await fetch('http://localhost:3001/api/files/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Delete response:', result);

      setClassifyCsvStatus({
        show: true,
        message: `Successfully deleted ${fileName}`,
        severity: 'success',
      });

      // Reload datasets and dropdowns
      await loadCsvFiles();
    } catch (error) {
      console.error('Error deleting CSV file:', error);
      setClassifyCsvStatus({
        show: true,
        message: `Error deleting ${fileName}: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Start editing a CSV file name
  const startEditingCsv = (file) => {
    setEditingCsvFile(file.path);
    // Remove .csv extension for editing but keep it stored internally
    setEditCsvFileName(file.name.replace(/\.csv$/, ''));
  };

  // Cancel editing CSV file
  const cancelEditingCsv = () => {
    setEditingCsvFile(null);
    setEditCsvFileName('');
  };

  // Rename a CSV file
  const renameCsvFile = async (filePath, newName) => {
    // Ensure newName has .csv extension
    if (!newName) {
      setClassifyCsvStatus({
        show: true,
        message: 'Please provide a new name',
        severity: 'warning',
      });
      return;
    }

    // Ensure the filename has .csv extension
    const formattedNewName = newName.endsWith('.csv')
      ? newName
      : `${newName}.csv`;

    try {
      setClassifyCsvStatus({
        show: true,
        message: `Renaming CSV file...`,
        severity: 'info',
      });
      setLoading(true);

      // This uses the same rename API endpoint as JSON files
      const response = await fetch('http://localhost:3001/api/files/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPath: filePath,
          newName: formattedNewName,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();

      setClassifyCsvStatus({
        show: true,
        message: `Successfully renamed file to ${formattedNewName}`,
        severity: 'success',
      });

      // Reset and reload
      setEditingCsvFile(null);
      setEditCsvFileName('');
      await loadCsvFiles();
    } catch (error) {
      console.error('Error renaming CSV file:', error);
      setClassifyCsvStatus({
        show: true,
        message: `Error renaming file: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Render tab panels

  // Create Embeddings Tab
  const renderCreateEmbeddingsTab = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        mt: 2,
      }}
    >
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
                              onClick={() =>
                                renameDataset(file.path, editFileName)
                              }
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
                              onClick={() =>
                                deleteDataset(file.path, file.name)
                              }
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

      <Paper elevation={3} sx={{ my: 2, p: 3, flex: 1 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          <UploadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Create Embeddings
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Upload a CSV file with <strong>category</strong> and{' '}
          <strong>comment</strong> columns to create embeddings.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              const csvContent =
                'category,comment\npositive,This product works great\nnegative,The quality was disappointing';
              const blob = new Blob([csvContent], {
                type: 'text/csv;charset=utf-8;',
              });
              const link = document.createElement('a');
              const url = URL.createObjectURL(blob);
              link.href = url;
              link.download = 'template.csv';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            Download Template CSV
          </Button>
        </Box>

        <Box
          sx={{
            mt: 3,
            p: 2,
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
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

        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          Your CSV file <strong>must</strong> have columns named{' '}
          <code>category</code> and <code>comment</code>.
        </Alert>

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
    </Box>
  );

  // Evaluate Tab (renamed to Config & Evaluate Tab)
  const renderManageEvaluateTab = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        mt: 2,
      }}
    >
      {/* Configuration Panel */}
      <Card sx={{ flex: 2 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Config
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            These settings control classification and evaluation behavior.
          </Typography>

          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ fontWeight: 'medium', mb: 2 }}
          >
            Classification Logic
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Weighted Votes
            </Typography>
            <Select
              value={weightedVotes ? 'true' : 'false'}
              onChange={(e) => setWeightedVotes(e.target.value === 'true')}
              disabled={loading}
              size="small"
            >
              <MenuItem value="true">Enabled</MenuItem>
              <MenuItem value="false">Disabled</MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              When enabled, votes are weighted by similarity scores; when
              disabled, uses simple majority vote
            </Typography>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Max Samples To Search
            </Typography>
            <TextField
              type="number"
              value={maxSamplesToSearch}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                  setMaxSamplesToSearch(value);
                }
              }}
              disabled={loading}
              size="small"
              InputProps={{
                inputProps: { min: 1 },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Maximum samples to compare for each classification
            </Typography>
          </FormControl>

          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ fontWeight: 'medium', mb: 2 }}
          >
            Thresholds
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Comparison Percentage
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                type="number"
                value={comparisonPercentage}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    setComparisonPercentage(value);
                  }
                }}
                disabled={loading}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="body2">%</Typography>,
                  inputProps: { min: 0, max: 100 },
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Percent of dataset to use for comparison (0-100)
            </Typography>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Similarity Threshold
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                type="number"
                value={similarityThresholdPercent}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    setSimilarityThresholdPercent(value);
                  }
                }}
                disabled={loading}
                size="small"
                InputProps={{
                  endAdornment: <Typography variant="body2">%</Typography>,
                  inputProps: { min: 0, max: 100 },
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Minimum cosine similarity required for a sample to be considered
              in classification
            </Typography>
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setWeightedVotes(true);
                setComparisonPercentage(80);
                setMaxSamplesToSearch(40);
                setSimilarityThresholdPercent(30);
              }}
              disabled={loading}
              size="small"
              startIcon={<SettingsIcon />}
            >
              Reset to Defaults
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Combined Evaluate Panel */}
      <Card sx={{ flex: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            <ChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Evaluate Embeddings
          </Typography>

          <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
            <InputLabel id="evaluation-model-label">
              Select Embedding Model
            </InputLabel>
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
            sx={{ mb: 3 }}
            startIcon={loading ? <CircularProgress size={24} /> : <ChartIcon />}
          >
            {loading ? 'Evaluating...' : 'Evaluate Model'}
          </Button>

          {evaluateStatus.show && (
            <Alert severity={evaluateStatus.severity} sx={{ mb: 3 }}>
              {evaluateStatus.message}
            </Alert>
          )}

          <Divider sx={{ mb: 3 }} />

          <Typography variant="h6" gutterBottom>
            Evaluation Results
          </Typography>

          {!evaluationResults ? (
            <Box
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '150px',
                backgroundColor: 'background.default',
                borderRadius: 1,
              }}
            >
              <Typography variant="body1" color="text.secondary" align="center">
                Select a model and click "Evaluate Model" to see results
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                p: 2,
                maxHeight: 400,
                overflow: 'auto',
                backgroundColor: 'background.default',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                borderRadius: 1,
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        mt: 2,
      }}
    >
      {/* CSV Management Panel */}
      <Card sx={{ flex: 1, my: 2, height: 'fit-content' }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            <DatasetIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Manage CSV Files
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Upload a CSV file with at least a <strong>comment</strong> column to
            classify.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                const csvContent =
                  "comment\nThis product is amazing\nThe service was terrible\nI'm not sure how I feel about it";
                const blob = new Blob([csvContent], {
                  type: 'text/csv;charset=utf-8;',
                });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = 'unclassified_template.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Download Template CSV
            </Button>
          </Box>

          <Box
            sx={{
              mt: 3,
              p: 2,
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-upload"
              type="file"
              onChange={handleClassifyCsvSelected}
            />
            <label htmlFor="csv-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
              >
                Choose CSV File
              </Button>
            </label>

            {classifyCsvToUpload && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Selected file: {classifyCsvToUpload.name}
              </Typography>
            )}
          </Box>

          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            Your CSV file <strong>must</strong> have a <code>comment</code>{' '}
            column.
          </Alert>

          <Button
            variant="contained"
            color="primary"
            disabled={!classifyCsvToUpload || loading}
            onClick={handleUploadClassifyCsv}
            fullWidth
            sx={{ mt: 2 }}
            startIcon={loading ? <CircularProgress size={24} /> : null}
          >
            {loading ? 'Processing...' : 'Upload CSV'}
          </Button>

          {classifyCsvStatus.show && (
            <Alert severity={classifyCsvStatus.severity} sx={{ mt: 2 }}>
              {classifyCsvStatus.message}
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Available CSV Files
          </Typography>

          <List
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 1,
              maxHeight: 250,
              overflow: 'auto',
            }}
          >
            {csvFiles.length === 0 ? (
              <ListItem>
                <ListItemText primary="No CSV files available" />
              </ListItem>
            ) : (
              csvFiles.map((file, index) => {
                const isEditing = editingCsvFile === file.path;

                return (
                  <React.Fragment key={file.path}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      {isEditing ? (
                        <TextField
                          value={editCsvFileName}
                          onChange={(e) => setEditCsvFileName(e.target.value)}
                          variant="standard"
                          autoFocus
                          fullWidth
                          sx={{ mr: 11 }}
                          disabled={loading}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && editCsvFileName.trim()) {
                              renameCsvFile(file.path, editCsvFileName);
                            }
                          }}
                          helperText=".csv will be added automatically"
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
                              onClick={() =>
                                renameCsvFile(file.path, editCsvFileName)
                              }
                              disabled={loading || !editCsvFileName.trim()}
                              color="primary"
                              sx={{ mr: 1 }}
                            >
                              <SaveIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              aria-label="cancel"
                              onClick={cancelEditingCsv}
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
                              onClick={() => startEditingCsv(file)}
                              disabled={loading || isEditing}
                              color="primary"
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() =>
                                deleteCsvFile(file.path, file.name)
                              }
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

      <Paper elevation={3} sx={{ my: 2, p: 3, flex: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Classify Data
        </Typography>

        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="classification-model-label">
              Select Embedding Model
            </InputLabel>
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
            <InputLabel id="unclassified-file-label">
              Select Unclassified CSV
            </InputLabel>
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
            disabled={
              !selectedClassificationModel || !selectedCsvFile || loading
            }
            onClick={handleClassifyData}
            fullWidth
            sx={{ mt: 2 }}
            startIcon={
              loading ? <CircularProgress size={24} /> : <CategoryIcon />
            }
          >
            {loading ? 'Classifying...' : 'Classify Data'}
          </Button>
        </Box>

        {classifyStatus.show && (
          <Alert severity={classifyStatus.severity} sx={{ mt: 2, mb: 3 }}>
            {classifyStatus.message}
          </Alert>
        )}

        {classificationResults.length > 0 ? (
          <Box sx={{ mt: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">Classification Results</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  // Create CSV content from classification results
                  const headers = [
                    'category',
                    'comment',
                    'nearest_cosine_score',
                    'similar_samples_count',
                  ];
                  const csvRows = [headers.join(',')];

                  classificationResults.forEach((row) => {
                    const formattedRow = [
                      `"${(row.category || 'Unknown').replace(/"/g, '""')}"`,
                      `"${row.comment.replace(/"/g, '""')}"`,
                      row.nearest_cosine_score
                        ? row.nearest_cosine_score
                        : 'N/A',
                      row.similar_samples_count || 'N/A',
                    ];
                    csvRows.push(formattedRow.join(','));
                  });

                  const csvContent = csvRows.join('\n');
                  const blob = new Blob([csvContent], {
                    type: 'text/csv;charset=utf-8;',
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'classification_results.csv');
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Download as CSV
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
              <Table
                stickyHeader
                aria-label="classification results table"
                size="small"
              >
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
                      <TableCell align="right">
                        {row.nearest_cosine_score
                          ? `${row.nearest_cosine_score}%`
                          : 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        {row.similar_samples_count || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Box
            sx={{
              mt: 4,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: '250px',
              justifyContent: 'center',
              backgroundColor: 'background.default',
              borderRadius: 1,
            }}
          >
            <CategoryIcon
              sx={{
                fontSize: 60,
                color: 'text.secondary',
                opacity: 0.5,
                mb: 2,
              }}
            />
            <Typography
              variant="h6"
              color="text.secondary"
              align="center"
              gutterBottom
            >
              No Classification Results Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Select an embedding model and an unclassified CSV file, then click
              "Classify Data" to see results here.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );

  // About Tab
  const renderAboutTab = () => (
    <Paper elevation={3} sx={{ my: 2, p: 3 }}>
      {readmeContent ? (
        <Box
          sx={{
            maxWidth: '900px',
            mx: 'auto',
            px: { xs: 1, sm: 2, md: 4 },
            py: 3,
            borderRadius: 1,
            bgcolor: 'background.default',
            '& img': { maxWidth: '100%' },
            '& h1': {
              fontSize: '2.2rem',
              mb: 2.5,
              fontWeight: 'bold',
              color: 'primary.main',
            },
            '& h2': {
              fontSize: '1.6rem',
              mt: 4,
              mb: 2.5,
              fontWeight: 'bold',
              color: mode === 'dark' ? 'primary.light' : 'primary.dark',
              borderBottom: 1,
              borderColor:
                mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
              pb: 1,
            },
            '& h3': {
              fontSize: '1.25rem',
              mt: 3,
              mb: 1.5,
              fontWeight: 'bold',
              color: mode === 'dark' ? 'primary.light' : 'primary.dark',
            },
            '& p': {
              my: 1.5,
              lineHeight: 1.6,
              maxWidth: '800px',
            },
            '& code': {
              bgcolor:
                mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)',
              p: 0.5,
              borderRadius: 0.5,
              fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
              fontSize: '0.9rem',
            },
            '& pre': {
              bgcolor:
                mode === 'dark'
                  ? 'rgba(30, 30, 30, 0.8)'
                  : 'rgba(240, 240, 240, 0.8)',
              p: 3,
              mt: 2,
              mb: 3,
              borderRadius: 1,
              overflowX: 'auto',
              border: 1,
              borderColor:
                mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
              boxShadow:
                mode === 'dark'
                  ? '0 3px 5px rgba(0, 0, 0, 0.3)'
                  : '0 1px 3px rgba(0, 0, 0, 0.1)',
              '& code': {
                p: 0,
                bgcolor: 'transparent',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
              },
            },
            '& ul, & ol': {
              pl: 4,
              mb: 2.5,
              mt: 1.5,
            },
            '& li': {
              mb: 1.5,
              lineHeight: 1.5,
            },
            '& blockquote': {
              borderLeft: 4,
              borderColor: 'primary.main',
              pl: 2,
              py: 1,
              my: 2,
              bgcolor:
                mode === 'dark'
                  ? 'rgba(144, 202, 249, 0.1)'
                  : 'rgba(25, 118, 210, 0.05)',
            },
            '& a': {
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            '& hr': {
              my: 4,
              border: 'none',
              height: '1px',
              bgcolor:
                mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
            },
          }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(readmeContent) }}
        />
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </Paper>
  );

  // Helper function to render markdown content
  const renderMarkdown = (markdown) => {
    // Enhanced markdown parser with better typography handling
    return (
      markdown
        // Headers with enhanced spacing
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
        // Bold with semantic meaning
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic with semantic meaning
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Code blocks with syntax highlighting hints - improved
        .replace(/```([a-zA-Z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
          // Trim empty lines at the start and end
          const trimmedCode = code.replace(/^\s*\n|\n\s*$/g, '');
          return `<pre class="language-${lang || 'text'}"><code>${trimmedCode}</code></pre>`;
        })
        // Fallback for code blocks without language specification
        .replace(/```([\s\S]*?)```/g, (match, code) => {
          // Trim empty lines at the start and end
          const trimmedCode = code.replace(/^\s*\n|\n\s*$/g, '');
          return `<pre><code>${trimmedCode}</code></pre>`;
        })
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Lists (unordered) with better spacing
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        .replace(/<\/li>\n<li>/g, '</li><li>')
        .replace(/<\/li>\n\n<li>/g, '</li></ul>\n\n<ul><li>')
        .replace(/^\<li\>/gm, '<ul><li>')
        .replace(/\<\/li\>$/gm, '</li></ul>')
        // Lists (ordered) - new addition
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        .replace(/^\<li\>/gm, '<ol><li>')
        .replace(/\<\/li\>$/gm, '</li></ol>')
        // Links with better accessibility
        .replace(
          /\[(.*?)\]\((.*?)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        )
        // Better paragraph handling - double line breaks create paragraphs
        .replace(/\n\n/g, '</p><p>')
        // Intelligent line breaks - single line breaks are preserved within paragraphs
        .replace(/\n/g, '<br />')
        // Wrap all content in a paragraph
        .replace(/^(.+)$/, '<p>$1</p>')
        // Fix duplicate paragraph tags
        .replace(/<p><p>/g, '<p>')
        .replace(/<\/p><\/p>/g, '</p>')
        // Blockquotes with better styling
        .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')
        // Image support with responsive sizing
        .replace(
          /!\[(.*?)\]\((.*?)\)/g,
          '<img src="$2" alt="$1" style="max-width:100%;height:auto;" />'
        )
        // Horizontal rule with semantic meaning
        .replace(/^---$/gm, '<hr aria-role="separator" />')
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box id="app-container">
        <AppBar position="sticky">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              embed-classify-web
            </Typography>
            <IconButton
              color="inherit"
              onClick={toggleColorMode}
              sx={{ ml: 1 }}
            >
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
            <Tab icon={<InfoIcon />} label="About" />
            <Tab icon={<UploadIcon />} label="Create and Manage" />
            <Tab icon={<SettingsIcon />} label="Config & Evaluate" />
            <Tab icon={<CategoryIcon />} label="Classify" />
          </Tabs>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
          {currentTab === 0 && renderAboutTab()}
          {currentTab === 1 && renderCreateEmbeddingsTab()}
          {currentTab === 2 && renderManageEvaluateTab()}
          {currentTab === 3 && renderClassifyTab()}
        </Container>

        <Box
          component="footer"
          sx={{ p: 2, textAlign: 'center', bgcolor: 'background.paper' }}
        >
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
