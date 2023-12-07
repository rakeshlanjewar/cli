import { _baseOptions } from '../core/yargs';
import { Argv } from 'yargs';
import configHelper from '../helpers/config-helper';
import viewHelper from '../helpers/view-helper';
import initHelper from '../helpers/init-helper';

const builder = (yargs: Argv) =>
  _baseOptions(yargs).option('force', {
    describe: 'Will drop the existing config folder and re-create it',
    type: 'boolean',
    default: false,
  }).argv;

const handler = async function (argv: ReturnType<typeof builder>) {
  const command = argv._[0];

  switch (command) {
    case 'init':
      await initConfig(argv);
      await initModels(argv);
      await initMigrations(argv);
      await initSeeders(argv);
      break;

    case 'init:config':
      await initConfig(argv);
      break;

    case 'init:models':
      await initModels(argv);
      break;

    case 'init:migrations':
      await initMigrations(argv);
      break;

    case 'init:seeders':
      await initSeeders(argv);
      break;
  }

  process.exit(0);
};

export default {
  builder,
  handler,
};

function initConfig(args: ReturnType<typeof builder>) {
  if (!configHelper.configFileExists() || !!args.force) {
    configHelper.writeDefaultConfig();
    viewHelper.log('Created "' + configHelper.relativeConfigFile() + '"');
  } else {
    viewHelper.notifyAboutExistingFile(configHelper.relativeConfigFile());
    process.exit(1);
  }
}

function initModels(args: ReturnType<typeof builder>) {
  initHelper.createModelsFolder(!!args.force);
  initHelper.createModelsIndexFile(!!args.force);
}

function initMigrations(args: ReturnType<typeof builder>) {
  initHelper.createMigrationsFolder(!!args.force);
}

function initSeeders(args: ReturnType<typeof builder>) {
  initHelper.createSeedersFolder(!!args.force);
}
