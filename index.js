const { program } = require('commander');

// Commands
const csvEmbedding = require('./commands/csv-embedding');
const embeddingClassification = require('./commands/embedding-classification');

program
  .command('csv-embedding')
  .description('create embedding json from csv')
  .requiredOption(
    '-i, --inputFile <filepath>',
    'must have a file path to a csv create embeddings'
  )
  .action(async (cmdObj) => {
    await csvEmbedding(cmdObj.inputFile);
  });

program
  .command('embedding-classification')
  .description('classify input csv against existing json')
  .requiredOption(
    '-i, --inputFile <filepath>',
    'must have a file path to unclassified input'
  )
  .requiredOption(
    '-c, --comparisonFile <filepath>',
    'must have a file path to embedding json'
  )
  .requiredOption(
    '-o, --outputFile <filepath>',
    'must have a file path to write predicted results'
  )
  .option('-r, --resultMetrics <boolean>', 'set true to add metrics to outputFile')
  .option('-e, --evaluteModel <boolean>', 'set true to run evaluation for comparison dataset')
  .action(async (cmdObj) => {
    await embeddingClassification(cmdObj.inputFile, cmdObj.comparisonFile, cmdObj.outputFile, cmdObj.resultMetrics, cmdObj.evaluteModel);
  });

program.parseAsync(process.argv);
