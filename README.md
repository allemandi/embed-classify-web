# 📦 embed-classify-web

Web application for local text classification using word embeddings.

## 🚀 Features

- 🔄 Convert CSV to JSON embeddings using [`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2)
- 🧠 Classify unlabelled text via pre-trained embeddings
- 📈 Optional evaluation of dataset performance
- 🗃️ Works with CSVs containing `category` and `comment` headers
- 🌐 Web interface for easy usage

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

---
