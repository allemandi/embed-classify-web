# embed-classify-web

Sleek, modern web app for text classification using embeddings.

## ✨ Features

- 🔄 Create embeddings from CSV data
- 🧠 Classify text with pretrained models
- 📊 Evaluate model performance
- ⚙️ Customizable classification parameters
- 🌗 Dark/light mode

## 🚀 Getting Started

```bash
git clone https://github.com/allemandi/embed-classify-web.git
cd embed-classify-web
yarn install
yarn start
```

Visit `http://localhost:3000` in your browser.

## 🛠 Usage

1. **Upload CSV** with labeled data (needs `category` and `comment` columns)
2. **Create embeddings** using the transformer model
3. **Classify new data** by uploading CSVs with a `comment` column
4. **Review results** instantly in the UI or download as CSV

### Classification Parameters

- **Weighted Votes**: Toggle similarity score weighting
- **Comparison %**: Portion of dataset to use for comparison
- **Sample Limit**: Maximum samples to compare per classification
- **Similarity Threshold**: Minimum required similarity score

## ⚙️ Built With

- React + Material UI for the frontend
- Express.js for the backend API
- [@xenova/transformers](https://huggingface.co/Xenova/all-MiniLM-L6-v2) for embeddings

## 🔗 Related Projects

Check out these related projects that might interest you:

- **[Embed Classify CLI](https://github.com/allemandi/embed-classify-cli)**  
  Node.js CLI tool for local text classification using word embeddings

- **[@allemandi/embed-utils](https://github.com/allemandi/embed-utils)**  
  Utilities for text classification using cosine similarity embeddings.

- **[Vector Knowledge Base](https://github.com/allemandi/vector-knowledge-base)**  
  A minimalist command-line knowledge system with semantic memory capabilities using vector embeddings for information retrieval.

## 🤝 Contributing

If you have ideas, improvements, or new features:

1. Fork the project
2. Create your feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add some amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

## ☕ Support

If this project has helped you or saved you time, consider [buying me a coffee](https://www.buymeacoffee.com/allemandi) to help fuel more ideas and improvements!

## 💡 Acknowledgments

This project was developed with the help of AI tools (e.g., GitHub Copilot, Cursor, v0) for code suggestions, debugging, and optimizations.

## 📄 License

MIT
