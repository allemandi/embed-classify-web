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
  .action(async (cmdObj) => {
    await embeddingClassification(cmdObj.inputFile, cmdObj.comparisonFile);
  });

program.parseAsync(process.argv);
