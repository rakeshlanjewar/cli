import process from 'process';
import { _baseOptions } from '../core/yargs';
import {
  getMigrator,
  ensureCurrentMetaSchema,
  addTimestampsToSchema,
} from '../core/migrator';
import _ from 'lodash';
import { Argv } from 'yargs';
import configHelper from '../helpers/config-helper';
import viewHelper from '../helpers/view-helper';

const builder = (yargs: Argv) =>
  _baseOptions(yargs)
    .option('to', {
      describe: 'Migration name to run migrations until',
      type: 'string',
    })
    .option('from', {
      describe: 'Migration name to start migrations from (excluding)',
      type: 'string',
    })
    .option('name', {
      describe:
        'Migration name. When specified, only this migration will be run. Mutually exclusive with --to and --from',
      type: 'string',
      conflicts: ['to', 'from'],
    }).argv;

const handler = async function (args: ReturnType<typeof builder>) {
  const command = args._[0];

  // legacy, gulp used to do this
  await configHelper.init();

  switch (command) {
    case 'db:migrate':
      await migrate(args);
      break;
    case 'db:migrate:schema:timestamps:add':
      await migrateSchemaTimestampAdd(args);
      break;
    case 'db:migrate:status':
      await migrationStatus(args);
      break;
  }

  process.exit(0);
};

export default {
  builder,
  handler,
};

function migrate(args: ReturnType<typeof builder>) {
  return getMigrator('migration', args)
    .then((migrator) => {
      return ensureCurrentMetaSchema(migrator)
        .then(() => migrator.pending())
        .then((migrations) => {
          const options: { to?: string; from?: string } = {};
          if (migrations.length === 0) {
            viewHelper.log(
              'No migrations were executed, database schema was already up to date.'
            );
            process.exit(0);
          }
          if (args.to) {
            if (
              migrations.filter((migration) => migration.file === args.to)
                .length === 0
            ) {
              viewHelper.log(
                'No migrations were executed, database schema was already up to date.'
              );
              process.exit(0);
            }
            options.to = args.to;
          }
          if (args.from) {
            if (
              migrations
                .map((migration) => migration.file)
                .lastIndexOf(args.from) === -1
            ) {
              viewHelper.log(
                'No migrations were executed, database schema was already up to date.'
              );
              process.exit(0);
            }
            options.from = args.from;
          }
          return options;
        })
        .then((options) => {
          if (args.name) {
            return migrator.up(args.name);
          } else {
            return migrator.up(options);
          }
        });
    })
    .catch((e) => viewHelper.error(e));
}

function migrationStatus(args: ReturnType<typeof builder>) {
  return getMigrator('migration', args)
    .then((migrator) => {
      return ensureCurrentMetaSchema(migrator)
        .then(() => migrator.executed())
        .then((migrations) => {
          _.forEach(migrations, (migration) => {
            viewHelper.log('up', migration.file);
          });
        })
        .then(() => migrator.pending())
        .then((migrations) => {
          _.forEach(migrations, (migration) => {
            viewHelper.log('down', migration.file);
          });
        });
    })
    .catch((e) => viewHelper.error(e));
}

function migrateSchemaTimestampAdd(args: ReturnType<typeof builder>) {
  return getMigrator('migration', args)
    .then((migrator) => {
      return addTimestampsToSchema(migrator).then((items) => {
        if (items) {
          viewHelper.log('Successfully added timestamps to MetaTable.');
        } else {
          viewHelper.log('MetaTable already has timestamps.');
        }
      });
    })
    .catch((e) => viewHelper.error(e));
}
