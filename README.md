# 📦 embed-classify-cli

Node.js CLI tool for local text classification using word embeddings.

## 🚀 Features

- 🔄 Convert CSV to JSON embeddings using [`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2)
- 🧠 Classify unlabelled text via pre-trained embeddings
- 📈 Optional evaluation of dataset performance
- 🗃️ Works with CSVs containing `category` and `comment` headers

> Ideal for local NLP classification workflows.

## 📦 Dependencies

Install with:

```
npm install
# or
yarn install
```

Uses: `@xenova/transformers`, `csvtojson`, `commander`, `pino`, `path`

## 🛠️ Usage

### 1. Prepare Your CSVs

Input CSV files must include:

- `category`: Label for training data
- `comment`: Text content to embed or classify

---

### 2. Generate Embeddings

Generate `embedding.json` from labeled CSV:

```
node index.js csv-embedding -i ./data/training.csv
```

---

### 3. Classify New Text

Use trained embeddings to classify new input:

```
node index.js embedding-classification -i ./data/unclassified.csv -c ./data/embedding.json -o ./data/predicted.csv
```

> Check configurable flags in `index.js` for more options.

---

## ⚙️ Configure Classification

Tune classification behavior in `embedding-classification.js` with these params:

- `--weightedVotes`  
  Use averaged similarity scores
- `--comparisonPercentage`  
  % of top similar samples to compare (0–100)
- `--maxSamplesToSearch`  
  Limit how many samples are compared
- `--similarityThresholdPercent`  
  Minimum cosine similarity to include in comparison

---

## 🌱 Potential Contributions / Improvements

- Enhanced classification & preprocessing algorithms
- Improved data input/upload flows
- Deployment & example datasets

---
