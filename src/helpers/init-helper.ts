import path from 'path';
import fs from 'fs';
import viewHelper from './view-helper';
import assetHelper from './asset-helper';
import pathHelper from './path-helper';
import configHelper from './config-helper';
import templateHelper from './template-helper';

function createFolder(folderName: string, folder: string, force: boolean) {
  if (force && fs.existsSync(folder) === true) {
    viewHelper.log('Deleting the ' + folderName + ' folder. (--force)');

    try {
      fs.readdirSync(folder).forEach((filename) => {
        fs.unlinkSync(path.resolve(folder, filename));
      });
    } catch (e) {
      viewHelper.error(e as Error);
    }

    try {
      fs.rmdirSync(folder);
      viewHelper.log('Successfully deleted the ' + folderName + ' folder.');
    } catch (e) {
      viewHelper.error(e as Error);
    }
  }

  try {
    if (fs.existsSync(folder) === false) {
      assetHelper.mkdirp(folder);
      viewHelper.log(
        'Successfully created ' + folderName + ' folder at "' + folder + '".'
      );
    } else {
      viewHelper.log(
        folderName + ' folder at "' + folder + '" already exists.'
      );
    }
  } catch (e) {
    viewHelper.error(e as Error);
  }
}

export default {
  createMigrationsFolder: (force = false) => {
    createFolder('migrations', pathHelper.getPath('migration'), force);
  },

  createSeedersFolder: (force = false) => {
    createFolder('seeders', pathHelper.getPath('seeder'), force);
  },

  createModelsFolder: (force: boolean) => {
    createFolder('models', pathHelper.getModelsPath(), force);
  },

  createModelsIndexFile: (force: boolean) => {
    const modelsPath = pathHelper.getModelsPath();
    const indexPath = path.resolve(
      modelsPath,
      pathHelper.addFileExtension('index')
    );

    if (!pathHelper.existsSync(modelsPath)) {
      viewHelper.log('Models folder not available.');
    } else if (pathHelper.existsSync(indexPath) && !force) {
      viewHelper.notifyAboutExistingFile(indexPath);
    } else {
      const relativeConfigPath = path.relative(
        pathHelper.getModelsPath(),
        configHelper.getConfigFile()
      );

      assetHelper.write(
        indexPath,
        templateHelper.render(
          'models/index.js',
          {
            configFile:
              "__dirname + '/" + relativeConfigPath.replace(/\\/g, '/') + "'",
          },
          {
            beautify: false,
          }
        )
      );
    }
  },
};
