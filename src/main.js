import './index.html';

// Initialize DOM elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadBtn');
const fileInfo = document.getElementById('fileInfo');
const statusMessage = document.getElementById('status');

// Classify Data elements
const embeddingSelect = document.getElementById('embeddingSelect');
const unclassifiedSelect = document.getElementById('unclassifiedSelect');
const classifyButton = document.getElementById('classifyBtn');
const classificationStatus = document.getElementById('classificationStatus');
const classificationResults = document.getElementById('classificationResults');

// Initialize the application
function init() {
  // Hide any previous error messages
  statusMessage.style.display = 'none';
  classificationStatus.style.display = 'none';
  console.log('Ready to accept CSV files for processing');
  
  // Load JSON files for the embedding dropdown
  loadEmbeddingFiles();
  
  // Load CSV files for the unclassified dropdown
  loadCsvFiles();
}

// Load JSON files for embedding dropdown
async function loadEmbeddingFiles() {
  try {
    console.log('Fetching JSON files from server...');
    const response = await fetch('http://localhost:3001/api/files/json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const files = await response.json();
    console.log('Received JSON files:', files);
    
    // Clear existing options except the first placeholder
    while (embeddingSelect.options.length > 1) {
      embeddingSelect.remove(1);
    }
    
    // Add json files to the dropdown
    files.forEach(file => {
      const option = document.createElement('option');
      option.value = file.path;
      option.textContent = file.name;
      embeddingSelect.appendChild(option);
      console.log(`Added option: ${file.name} with value: ${file.path}`);
    });
    
    // Enable/disable the classify button based on selection
    updateClassifyButtonState();
    console.log('Classify button state updated:', !embeddingSelect.disabled);
  } catch (error) {
    console.error('Error loading JSON files:', error);
    classificationStatus.textContent = `Error loading JSON files: ${error.message}`;
    classificationStatus.className = 'error';
    classificationStatus.style.display = 'block';
  }
}

// Load CSV files for unclassified dropdown
async function loadCsvFiles() {
  try {
    const response = await fetch('http://localhost:3001/api/files/csv');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const files = await response.json();
    
    // Clear existing options except the first placeholder
    while (unclassifiedSelect.options.length > 1) {
      unclassifiedSelect.remove(1);
    }
    
    // Add csv files to the dropdown
    files.forEach(file => {
      const option = document.createElement('option');
      option.value = file.path;
      option.textContent = file.name;
      unclassifiedSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading CSV files:', error);
  }
}

// Enable or disable the classify button based on dropdown selection
function updateClassifyButtonState() {
  const isEnabled = embeddingSelect.value !== '';
  classifyButton.disabled = !isEnabled;
  console.log(`Classify button ${isEnabled ? 'enabled' : 'disabled'}`);
}

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

// Highlight drop zone when dragging over it
['dragenter', 'dragover'].forEach(eventName => {
  dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, unhighlight, false);
});

// Handle dropped files
dropZone.addEventListener('drop', handleDrop, false);

// Handle file input change
fileInput.addEventListener('change', handleFileSelect, false);

// Handle embedding select change
embeddingSelect.addEventListener('change', () => {
  console.log('Embedding selection changed to:', embeddingSelect.value);
  updateClassifyButtonState();
});

// Handle classify button click
classifyButton.addEventListener('click', handleClassification);

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight(e) {
  dropZone.classList.add('dragover');
}

function unhighlight(e) {
  dropZone.classList.remove('dragover');
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

function handleFileSelect(e) {
  const files = e.target.files;
  handleFiles(files);
}

function handleFiles(files) {
  if (files.length > 0) {
    const file = files[0];
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      fileInfo.textContent = `Selected file: ${file.name}`;
      uploadButton.disabled = false;
    } else {
      fileInfo.textContent = 'Please select a CSV file';
      uploadButton.disabled = true;
    }
  }
}

async function handleClassification() {
  const embeddingFile = embeddingSelect.value;
  const unclassifiedFile = unclassifiedSelect.value;
  
  console.log('Classification requested:');
  console.log('- Embedding file:', embeddingFile);
  console.log('- Unclassified file:', unclassifiedFile || 'None');
  
  if (!embeddingFile) {
    classificationStatus.textContent = 'Please select an embedding file';
    classificationStatus.className = 'error';
    classificationStatus.style.display = 'block';
    return;
  }
  
  try {
    classificationStatus.textContent = 'Processing classification...';
    classificationStatus.className = '';
    classificationStatus.style.display = 'block';
    classifyButton.disabled = true;
    classificationResults.textContent = '';
    
    console.log('Sending classification request to server...');
    const response = await fetch('http://localhost:3001/api/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeddingFile,
        unclassifiedFile: unclassifiedFile || null,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Received classification result:', result);
    
    classificationStatus.className = 'success';
    classificationStatus.textContent = result.message;
    
    if (result.evaluationResults) {
      // Format and display the evaluation results
      const metrics = result.evaluationResults;
      let resultsText = '=== Model Evaluation Results ===\n';
      resultsText += `Total Test Samples: ${metrics.totalPredictions}\n`;
      resultsText += `Correct Predictions: ${metrics.correctPredictions}\n`;
      resultsText += `Overall Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%\n`;
      resultsText += `Average Confidence: ${(metrics.avgConfidence * 100).toFixed(2)}%\n\n`;
      
      resultsText += '=== Category-wise Performance ===\n';
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
      
      classificationResults.textContent = resultsText;
      console.log('Displayed evaluation results');
    } else {
      console.warn('No evaluation results received from server');
    }
  } catch (error) {
    console.error('Classification error:', error);
    classificationStatus.className = 'error';
    classificationStatus.textContent = `Error: ${error.message}`;
  } finally {
    classifyButton.disabled = false;
  }
}

// Handle file upload
uploadButton.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) {
    statusMessage.textContent = 'Please select a file first';
    statusMessage.style.display = 'block';
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    statusMessage.textContent = 'Uploading file...';
    statusMessage.style.display = 'block';
    statusMessage.className = '';
    uploadButton.disabled = true;

    const response = await fetch('http://localhost:3001/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    statusMessage.className = 'success';
    statusMessage.textContent = result.message;
    
    // Reset form
    fileInput.value = '';
    fileInfo.textContent = '';
    uploadButton.disabled = true;
    
    // Reload file lists after successful upload
    loadEmbeddingFiles();
    loadCsvFiles();
  } catch (error) {
    statusMessage.className = 'error';
    statusMessage.textContent = `Error: ${error.message}`;
    uploadButton.disabled = false;
  }
});

// Initialize app on page load
document.addEventListener('DOMContentLoaded', init); 