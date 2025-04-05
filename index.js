const { program } = require('commander');

// Commands
const csvEmbedding = require('./commands/csv-embedding');
const embeddingClassification = require('./commands/embedding-classification');

// Utility function for handling errors
function handleError(err) {
  logger.error(err);
  process.exit(1);
}

program
  .command('csv-embedding')
  .description('Create embedding JSON from CSV')
  .requiredOption(
    '-i, --inputFile <filepath>',
    'File path to the CSV for creating embeddings'
  )
  .action(async (cmdObj) => {
    await csvEmbedding(cmdObj.inputFile);
  });

program
  .command('embedding-classification')
  .description('Classify input CSV against existing JSON')
  .requiredOption(
    '-i, --inputFile <filepath>',
    'File path to unclassified input'
  )
  .requiredOption(
    '-c, --comparisonFile <filepath>',
    'File path to the embedding JSON'
  )
  .requiredOption(
    '-o, --outputFile <filepath>',
    'File path to write predicted results'
  )
  .option('-r, --resultMetrics', 'Include to add metrics to outputFile')
  .option(
    '-e, --evaluteModel',
    'Include to run evaluation for comparison dataset'
  )
  .action(async (cmdObj) => {
    await embeddingClassification(
      cmdObj.inputFile,
      cmdObj.comparisonFile,
      cmdObj.outputFile,
      cmdObj.resultMetrics,
      cmdObj.evaluteModel
    );
  });

program.parseAsync(process.argv);
