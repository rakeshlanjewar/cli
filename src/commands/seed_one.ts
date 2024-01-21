import { _baseOptions } from '../core/yargs';
import { getMigrator } from '../core/migrator';
import path from 'path';
import _ from 'lodash';
import configHelper from '../helpers/config-helper';
import viewHelper from '../helpers/view-helper';
import umzugHelper from '../helpers/umzug-helper';
import { Argv } from 'yargs';

const builder = (yargs: Argv) =>
  _baseOptions(yargs).option('seed', {
    describe: 'List of seed files',
    type: 'array',
    string: true,
    default: [''],
  }).argv;

const handler = async function (args: ReturnType<typeof builder>) {
  const command = args._[0];

  // legacy, gulp used to do this
  await configHelper.init();

  switch (command) {
    case 'db:seed':
      try {
        const migrator = await getMigrator('seeder', args);

        // filter out cmd names
        // for case like --seeders-path seeders --seed seedPerson.js db:seed
        const seeds = (args.seed || [])
          .filter((name) => name !== 'db:seed' && name !== 'db:seed:undo')
          .map((file) => path.basename(file));

        await migrator.up({ migrations: seeds });
      } catch (e) {
        viewHelper.error(e as Error);
      }
      break;

    case 'db:seed:undo':
      try {
        const migrator = await getMigrator('seeder', args);
        let seeders =
          umzugHelper.getStorage('seeder') === 'none'
            ? await migrator.pending()
            : await migrator.executed();

        if (args.seed) {
          seeders = seeders.filter((seed) => {
            return args.seed.includes(seed.name);
          });
        }

        if (seeders.length === 0) {
          viewHelper.log('No seeders found.');
          return;
        }

        if (!args.seed) {
          seeders = seeders.slice(-1);
        }

        await migrator.down({
          migrations: _.chain(seeders).map('file').reverse().value(),
        });
      } catch (e) {
        viewHelper.error(e as Error);
      }
      break;
  }

  process.exit(0);
};

export default {
  builder,
  handler,
};
