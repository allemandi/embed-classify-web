# embed-classify-web

A sleek, modern web app for text classification using embeddings.

## Features

- 🔄 Create embeddings from CSV data
- 🧠 Classify text with pretrained models
- 📊 Evaluate model performance
- ⚙️ Customizable classification parameters
- 🌗 Dark/light mode

## Quick Start

Install dependencies

- `yarn install`

Run application

- `yarn start`

Visit `http://localhost:3000` in your browser.

## How It Works

1. **Upload CSV** with labeled data (needs `category` and `comment` columns)
2. **Create embeddings** using the transformer model
3. **Classify new data** by uploading CSVs with a `comment` column
4. **Review results** instantly in the UI or download as CSV

## Classification Parameters

- **Weighted Votes**: Toggle similarity score weighting
- **Comparison %**: Portion of dataset to use for comparison
- **Sample Limit**: Maximum samples to compare per classification
- **Similarity Threshold**: Minimum required similarity score

## Tech Stack

- React + Material UI for the frontend
- Express.js for the backend API
- [@xenova/transformers](https://huggingface.co/Xenova/all-MiniLM-L6-v2) for embeddings

## License

MIT

---
