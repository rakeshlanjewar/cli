import { _baseOptions, _underscoreOption } from '../core/yargs';

import fs from 'fs';
import clc from 'cli-color';
import { Argv } from 'yargs';
import initHelper from '../helpers/init-helper';
import pathHelper from '../helpers/path-helper';
import templateHelper from '../helpers/template-helper';
import viewHelper from '../helpers/view-helper';

const builder = (yargs: Argv) =>
  _underscoreOption(
    _baseOptions(yargs).option('name', {
      describe: 'Defines the name of the migration',
      type: 'string',
      demandOption: true,
    })
  ).argv;

const handler = function (args: ReturnType<typeof builder>) {
  initHelper.createMigrationsFolder();

  fs.writeFileSync(
    pathHelper.getMigrationPath(args.name),
    templateHelper.render(
      'migrations/skeleton.js',
      {},
      {
        beautify: false,
      }
    )
  );

  viewHelper.log(
    'New migration was created at',
    clc.blueBright(pathHelper.getMigrationPath(args.name)),
    '.'
  );

  process.exit(0);
};

export default {
  builder,
  handler,
};
