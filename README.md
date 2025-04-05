# cli-word-embedding-classification

## Purpose
Set of CLI scripts that:
- Read CSV files and convert into files for word embeddings
- Compare unclassified input against existing word embeddings
  - Write predicted categories against unclassified input
  - Optional: Test performance metrics of existing dataset

## CSV Formats
Training and input CSV files must have the following headers:
- `category`: The classification category
- `comment`: The text content to be classified

## Dependencies
Requires Node.js.

Run `npm install` (or, if you have yarn, `yarn install`) to install the following dependencies:
- @xenova/transformers: Machine learning transformers
- commander: CLI interface
- csvtojson: CSV parsing
- path: File path handling
- pino: Logging utilities

## How to Run
### Generate Embeddings from CSV
- Ensure you have a training file (e.g. training.csv) that has comment and category headers.
  - This is your pre-classified data to be used for embeddings
- In the main directory where index.js sits, run to generate a `embedding.json` file:
```
node index.js csv-embedding -i ./data/training.csv
```
- Or you can define your own file paths and names for the training csv files.

### Classify new data using trained embeddings
- Ensure you have filepaths for the following:
  - csv file with unclassified text under a comment header.
  - json embedding file generated from CSV
- In the main directory where index.js sits, run:

```
node index.js embedding-classification -i ./data/unclassified.csv -c ./data/embedding.json -o ./data/predicted.csv
```
- Or define your own file paths and names.
- See index.js for all param details. Optionals are all off by default.

## Text Classification Configuration
- Consider modifying following values:
  - weightedVotes
    - Boolean flag, set this to false for a simple majority vote instead of averaged aggregated scores to pick a category
  - comparisonPercentage
    - Set anywhere from 0 to 100. Should be set to high to utilize more of the existing embeddings used for comparison
  - maxSamplesToSearch
    - Limits max number of samples to compare unclassified queries against. Can impact weightedVote
  - similarityThresholdPercent
    - Minimum cosine similarity percentage, further excludes possible comparison samples against unclassified queries. Heavily dependent on model and comparison dataset. Can impact weightedVote.

## Potential Contributions / Improvements
Ideas that can further improve upon this concept include:
- Better algorithms, data pre-processing
- Better data management for input / upload
- Better deployment