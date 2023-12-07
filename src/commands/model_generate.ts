import { _baseOptions, _underscoreOption } from '../core/yargs';
import clc from 'cli-color';
import modelHelper from '../helpers/model-helper';
import viewHelper from '../helpers/view-helper';
import migrationHelper from '../helpers/migration-helper';
import pathHelper from '../helpers/path-helper';
import { Argv } from 'yargs';

const builder = (yargs: Argv) =>
  _underscoreOption(
    _baseOptions(yargs)
      .option('name', {
        describe: 'Defines the name of the new model',
        type: 'string',
        demandOption: true,
      })
      .option('attributes', {
        describe: 'A list of attributes',
        type: 'string',
        demandOption: true,
      })
      .option('force', {
        describe: 'Forcefully re-creates model with the same name',
        type: 'string',
        demandOption: false,
      })
  ).argv;

const handler = function (args: ReturnType<typeof builder>) {
  ensureModelsFolder();
  ensureMigrationsFolder();
  checkModelFileExistence(args);

  try {
    modelHelper.generateFile(args);
  } catch (err) {
    viewHelper.error(err.message);
  }

  migrationHelper.generateTableCreationFile(args);
  viewHelper.log(
    'New model was created at',
    clc.blueBright(pathHelper.getModelPath(args.name)),
    '.'
  );
  viewHelper.log(
    'New migration was created at',
    clc.blueBright(
      pathHelper.getMigrationPath(migrationHelper.generateMigrationName(args))
    ),
    '.'
  );

  process.exit(0);
};

function ensureModelsFolder() {
  if (!pathHelper.existsSync(pathHelper.getModelsPath())) {
    viewHelper.error(
      'Unable to find models path (' +
        pathHelper.getModelsPath() +
        '). Did you run ' +
        clc.blueBright('sequelize init') +
        '?'
    );
  }
}

function ensureMigrationsFolder() {
  if (!pathHelper.existsSync(pathHelper.getPath('migration'))) {
    viewHelper.error(
      'Unable to find migrations path (' +
        pathHelper.getPath('migration') +
        '). Did you run ' +
        clc.blueBright('sequelize init') +
        '?'
    );
  }
}

function checkModelFileExistence(args: ReturnType<typeof builder>) {
  const modelPath = pathHelper.getModelPath(args.name);

  if (args.force === undefined && modelHelper.modelFileExists(modelPath)) {
    viewHelper.notifyAboutExistingFile(modelPath);
    process.exit(1);
  }
}

export default {
  builder,
  handler,
};
