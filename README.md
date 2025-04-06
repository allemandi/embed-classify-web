# 📦 embed-classify-web

A modern web application for embedding and classifying text data using machine learning.

## 🚀 Features

- 🔄 Convert CSV to JSON embeddings using [`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2)
- 🧠 Classify unlabelled text via pre-trained embeddings
- 📈 Optional evaluation of dataset performance
- 🗃️ Works with CSVs containing `category` and `comment` headers
- 🌐 Web interface for easy usage
- Modern, responsive UI with dark/light mode
- Mobile-friendly interface

> Ideal for local NLP classification workflows.

## 📦 Dependencies

Install with:

```
npm install
# or
yarn install
```

Uses: `@xenova/transformers`, `csvtojson`, `express`, `multer`, `vite`, and more.

## 🛠️ Usage

### Running the Web Application

Start the web application with:

```
npm start
# or
yarn start
```

This will start both the Vite development server and the backend API server.

### Using the Web Interface

1. **Create Embeddings**: Upload a CSV file with labeled data to create embeddings
2. **Evaluate Model**: Select an embedding file to evaluate its performance
3. **Classify New Data**: Select an embedding file and an unclassified CSV to get predictions

## ⚙️ Classification Parameters

The classification parameters are automatically handled through the web interface:

- **Weighted Votes**: Use averaged similarity scores
- **Comparison Percentage**: % of top similar samples to compare
- **Max Samples To Search**: Limit how many samples are compared
- **Similarity Threshold**: Minimum cosine similarity to include

## 🌱 Potential Contributions / Improvements

- Enhanced classification & preprocessing algorithms
- Improved data input/upload flows
- Deployment & example datasets

## Getting Started

### Prerequisites

- Node.js (v16+)
- Yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/embed-classify-web.git
cd embed-classify-web
```

2. Install dependencies:
```bash
yarn install
```

3. Start the application:
```bash
yarn start
```

This will start both the frontend development server and the backend API server.

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Usage

### 1. Create Embeddings

1. Go to the "Create" tab
2. Upload a CSV file containing your training data
3. Click "Upload and Process" to generate embeddings

### 2. Manage & Evaluate Models

1. Go to the "Manage & Evaluate" tab
2. Select a model to evaluate from the dropdown
3. Click "Evaluate" to see model performance metrics
4. You can also delete models you no longer need

### 3. Classify New Data

1. Go to the "Classify" tab
2. Select a model to use for classification
3. Select the CSV file with unclassified data
4. Click "Classify Data" to categorize your data
5. View the results in the table below

## UI Features

- **Dark/Light Mode Toggle**: Click the sun/moon icon in the top-right corner to switch between dark and light modes
- **Responsive Design**: The application works on both desktop and mobile devices
- **Modern UI Components**: Built with Material-UI for a sleek, professional appearance

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---
