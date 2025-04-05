const { program } = require('commander');

// Commands
const csvEmbedding = require('./commands/csv-embedding');

program
  .command('csv-embedding')
  .description('create csv embedding')
  .requiredOption(
    '-i, --inputFile <filepath>',
    'must have a file path to a csv create embeddings'
  )
  .action(async (cmdObj) => {
    await csvEmbedding(cmdObj.inputFile);
  });

program.parseAsync(process.argv);
