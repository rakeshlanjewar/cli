import { _baseOptions } from '../core/yargs';
import { getMigrator, ensureCurrentMetaSchema } from '../core/migrator';
import { Argv } from 'yargs';
import configHelper from '../helpers/config-helper';
import viewHelper from '../helpers/view-helper';

const builder = (yargs: Argv) =>
  _baseOptions(yargs).option('name', {
    describe: 'Name of the migration to undo',
    type: 'string',
  }).argv;

const handler = async function (args: ReturnType<typeof builder>) {
  // legacy, gulp used to do this
  await configHelper.init();

  await migrateUndo(args);

  process.exit(0);
};

function migrateUndo(args: ReturnType<typeof builder>) {
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
        .then(() => {
          if (args.name) {
            return migrator.down({ migrations: [args.name] });
          } else {
            return migrator.down();
          }
        });
    })
    .catch((e) => viewHelper.error(e));
}

export default {
  builder,
  handler,
};
