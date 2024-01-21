import fs from 'fs-extra';
import path from 'path';

const assetHelper = {
  copy: (from: string, to: string) => {
    fs.copySync(path.resolve(__dirname, '..', 'assets', from), to);
  },

  read: (assetPath: string) => {
    return fs
      .readFileSync(path.resolve(__dirname, '..', 'assets', assetPath))
      .toString();
  },

  write: (targetPath: string, content: string) => {
    fs.writeFileSync(targetPath, content);
  },

  inject: (filePath: string, token: string, content: string) => {
    const fileContent = fs.readFileSync(filePath).toString();
    fs.writeFileSync(filePath, fileContent.replace(token, content));
  },

  injectConfigFilePath: (filePath: string, configPath: string) => {
    assetHelper.inject(filePath, '__CONFIG_FILE__', configPath);
  },

  mkdirp: (pathToCreate: string) => {
    fs.mkdirpSync(pathToCreate);
  },
};

export default assetHelper;
