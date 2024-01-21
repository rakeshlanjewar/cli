import { _baseOptions } from '../core/yargs';
import { getMigrator, ensureCurrentMetaSchema } from '../core/migrator';
import { Argv } from 'yargs';
import configHelper from '../helpers/config-helper';
import viewHelper from '../helpers/view-helper';

const builder = (yargs: Argv) =>
  _baseOptions(yargs).option('to', {
    describe: 'Revert to the provided migration',
    type: 'string',
  }).argv;

const handler = async function (args: ReturnType<typeof builder>) {
  // legacy, gulp used to do this
  await configHelper.init();

  await migrationUndoAll(args);

  process.exit(0);
};

function migrationUndoAll(args: ReturnType<typeof builder>) {
  return getMigrator('migration', args)
    .then((migrator) => {
      return ensureCurrentMetaSchema(migrator)
        .then(() => migrator.executed())
        .then((migrations) => {
          if (migrations.length === 0) {
            viewHelper.log('No executed migrations found.');
            process.exit(0);
          }
        })
        .then(() => migrator.down({ to: args.to || 0 }));
    })
    .catch((e) => viewHelper.error(e));
}

export default {
  builder,
  handler,
};
