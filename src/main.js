import './index.html';

// Initialize DOM elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadBtn');
const fileInfo = document.getElementById('fileInfo');
const statusMessage = document.getElementById('status');

// Initialize the application
function init() {
  // Hide any previous error messages
  statusMessage.style.display = 'none';
  console.log('Ready to accept CSV files for processing');
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
  } catch (error) {
    statusMessage.className = 'error';
    statusMessage.textContent = `Error: ${error.message}`;
    uploadButton.disabled = false;
  }
});

// Initialize app on page load
document.addEventListener('DOMContentLoaded', init); 