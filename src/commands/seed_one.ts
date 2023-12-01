import process from 'process';
import { _baseOptions } from '../core/yargs';
import { getMigrator } from '../core/migrator';

import { helpers } from '../helpers';
import path from 'path';
import _ from 'lodash';
import { Argv } from 'yargs';

export const seedOneBuilder = (yargs: Argv) =>
  _baseOptions(yargs).option('seed', {
    describe: 'List of seed files',
    type: 'array',
  }).argv;

type BuilderArgType = ReturnType<typeof seedOneBuilder>;

export default async function (args: BuilderArgType) {
  const command = args._[0];

  // legacy, gulp used to do this
  await helpers.config.init();

  switch (command) {
    case 'db:seed':
      try {
        const migrator = await getMigrator('seeder', args);

        // filter out cmd names
        // for case like --seeders-path seeders --seed seedPerson.js db:seed
        const seeds = (args.seed || [])
          .filter((name) => name !== 'db:seed' && name !== 'db:seed:undo')
          .map((file) => path.basename(String(file)));

        await migrator.up(seeds);
      } catch (e) {
        helpers.view.error(e as any);
      }
      break;

    case 'db:seed:undo':
      try {
        const migrator = await getMigrator('seeder', args);
        let seeders =
          helpers.umzug.getStorage('seeder') === 'none'
            ? await migrator.pending()
            : await migrator.executed();

        if (args.seed) {
          seeders = seeders.filter((seed) => {
            return args?.seed?.includes(seed.file);
          });
        }

        if (seeders.length === 0) {
          helpers.view.log('No seeders found.');
          return;
        }

        if (!args.seed) {
          seeders = seeders.slice(-1);
        }

        await migrator.down({
          migrations: _.chain(seeders).map('file').reverse().value(),
        });
      } catch (e) {
        helpers.view.error(e as any);
      }
      break;
  }

  process.exit(0);
}
