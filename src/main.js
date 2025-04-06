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

// Prediction elements
const predictButton = document.getElementById('predictBtn');
const predictionStatus = document.getElementById('predictionStatus');
const resultsTableContainer = document.getElementById('resultsTableContainer');
const resultsTableBody = document.getElementById('resultsTableBody');

// Initialize the application
function init() {
  // Hide any previous error messages
  statusMessage.style.display = 'none';
  classificationStatus.style.display = 'none';
  predictionStatus.style.display = 'none';
  resultsTableContainer.style.display = 'none';
  console.log('Ready to accept CSV files for processing');
  
  // Load JSON files for the embedding dropdown
  loadEmbeddingFiles();
  
  // Load CSV files for the unclassified dropdown
  loadCsvFiles();
  
  // Verify event listeners are properly attached
  console.log('Event listeners verification:');
  console.log('- classifyButton element found:', classifyButton !== null);
  console.log('- predictButton element found:', predictButton !== null);
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
  
  // Also update the predict button state
  updatePredictButtonState();
}

// Enable or disable the predict button based on dropdown selections
function updatePredictButtonState() {
  const embeddingSelected = embeddingSelect.value !== '';
  const unclassifiedSelected = unclassifiedSelect.value !== '';
  const isEnabled = embeddingSelected && unclassifiedSelected;
  
  predictButton.disabled = !isEnabled;
  console.log(`Predict button ${isEnabled ? 'enabled' : 'disabled'}`);
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

// Handle unclassified select change
unclassifiedSelect.addEventListener('change', () => {
  console.log('Unclassified file selection changed to:', unclassifiedSelect.value);
  updatePredictButtonState();
});

// Handle classify button click
classifyButton.addEventListener('click', (e) => {
  console.log('Classify button clicked!', e);
  handleClassification();
});

// Handle predict button click
predictButton.addEventListener('click', (e) => {
  console.log('Predict button clicked!', e);
  handlePrediction();
});

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

// Handle prediction
async function handlePrediction() {
  const embeddingFile = embeddingSelect.value;
  const unclassifiedFile = unclassifiedSelect.value;
  
  console.log('Prediction requested:');
  console.log('- Embedding file:', embeddingFile);
  console.log('- Unclassified file:', unclassifiedFile);
  
  if (!embeddingFile) {
    predictionStatus.textContent = 'Please select an embedding file';
    predictionStatus.className = 'error';
    predictionStatus.style.display = 'block';
    return;
  }
  
  if (!unclassifiedFile) {
    predictionStatus.textContent = 'Please select an unclassified file to classify';
    predictionStatus.className = 'error';
    predictionStatus.style.display = 'block';
    return;
  }
  
  try {
    predictionStatus.textContent = 'Processing classification...';
    predictionStatus.className = '';
    predictionStatus.style.display = 'block';
    predictButton.disabled = true;
    
    // Hide the results table while processing
    resultsTableContainer.style.display = 'none';
    resultsTableBody.innerHTML = '';
    
    console.log('Sending classification request to server...');
    const response = await fetch('http://localhost:3001/api/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeddingFile,
        unclassifiedFile,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Received classification result:', result);
    
    predictionStatus.className = 'success';
    predictionStatus.textContent = 'Classification completed successfully. Fetching results...';
    
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
        // Display results in table
        resultsTableBody.innerHTML = '';
        
        csvData.forEach(row => {
          const tr = document.createElement('tr');
          
          // Category column
          const categoryTd = document.createElement('td');
          categoryTd.textContent = row.category || 'Unknown';
          categoryTd.style.padding = '0.75rem';
          categoryTd.style.border = '1px solid #ddd';
          tr.appendChild(categoryTd);
          
          // Comment column
          const commentTd = document.createElement('td');
          commentTd.textContent = row.comment;
          commentTd.style.padding = '0.75rem';
          commentTd.style.border = '1px solid #ddd';
          tr.appendChild(commentTd);
          
          // Cosine Score column
          const scoreTd = document.createElement('td');
          if (row.nearest_cosine_score) {
            scoreTd.textContent = `${row.nearest_cosine_score}%`;
          } else {
            scoreTd.textContent = 'N/A';
          }
          scoreTd.style.padding = '0.75rem';
          scoreTd.style.border = '1px solid #ddd';
          tr.appendChild(scoreTd);
          
          // Similar Samples column
          const samplesTd = document.createElement('td');
          samplesTd.textContent = row.similar_samples_count || 'N/A';
          samplesTd.style.padding = '0.75rem';
          samplesTd.style.border = '1px solid #ddd';
          tr.appendChild(samplesTd);
          
          resultsTableBody.appendChild(tr);
        });
        
        // Show the results table
        resultsTableContainer.style.display = 'block';
        predictionStatus.textContent = 'Classification completed successfully. Results displayed below.';
      } else {
        predictionStatus.textContent = 'Classification completed but no results were returned.';
      }
    } catch (error) {
      console.error('Error fetching classification results:', error);
      predictionStatus.className = 'error';
      predictionStatus.textContent = `Error fetching results: ${error.message}`;
    }
  } catch (error) {
    console.error('Classification error:', error);
    predictionStatus.className = 'error';
    predictionStatus.textContent = `Error: ${error.message}`;
  } finally {
    predictButton.disabled = false;
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