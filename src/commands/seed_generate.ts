import { _baseOptions } from '../core/yargs';

import fs from 'fs';
import clc from 'cli-color';
import initHelper from '../helpers/init-helper';
import pathHelper from '../helpers/path-helper';
import templateHelper from '../helpers/template-helper';
import viewHelper from '../helpers/view-helper';
import { Argv } from 'yargs';

const builder = (yargs: Argv) =>
  _baseOptions(yargs).option('name', {
    describe: 'Defines the name of the seed',
    type: 'string',
    demandOption: true,
  }).argv;

const handler = function (args: ReturnType<typeof builder>) {
  initHelper.createSeedersFolder();

  fs.writeFileSync(
    pathHelper.getSeederPath(args.name),
    templateHelper.render(
      'seeders/skeleton.js',
      {},
      {
        beautify: false,
      }
    )
  );

  viewHelper.log(
    'New seed was created at',
    clc.blueBright(pathHelper.getSeederPath(args.name)),
    '.'
  );

  process.exit(0);
};

export default {
  builder,
  handler,
};
