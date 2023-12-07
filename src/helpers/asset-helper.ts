import fs from 'fs-extra';
import path from 'path';

const assetHelper = {
  copy: (from, to) => {
    fs.copySync(path.resolve(__dirname, '..', 'assets', from), to);
  },

  read: (assetPath: string) => {
    return fs
      .readFileSync(path.resolve(__dirname, '..', 'assets', assetPath))
      .toString();
  },

  write: (targetPath, content) => {
    fs.writeFileSync(targetPath, content);
  },

  inject: (filePath, token, content) => {
    const fileContent = fs.readFileSync(filePath).toString();
    fs.writeFileSync(filePath, fileContent.replace(token, content));
  },

  injectConfigFilePath: (filePath, configPath) => {
    assetHelper.inject(filePath, '__CONFIG_FILE__', configPath);
  },

  mkdirp: (pathToCreate) => {
    fs.mkdirpSync(pathToCreate);
  },
};

export default assetHelper;
