import path from 'path';
import fs, { constants } from 'fs';
import getYArgs from '../core/yargs';
import { sync as resolve } from 'resolve';

const args = getYArgs().argv;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function format(i: any) {
  return parseInt(i, 10) < 10 ? '0' + i : i;
}

function getCurrentYYYYMMDDHHmms() {
  const date = new Date();
  return [
    date.getUTCFullYear(),
    format(date.getUTCMonth() + 1),
    format(date.getUTCDate()),
    format(date.getUTCHours()),
    format(date.getUTCMinutes()),
    format(date.getUTCSeconds()),
  ].join('');
}

export default {
  getPath(type: string) {
    type = type + 's';

    let result =
      (args[type + 'Path'] as string) || path.resolve(process.cwd(), type);

    if (path.normalize(result) !== path.resolve(result)) {
      // the path is relative
      result = path.resolve(process.cwd(), result);
    }

    return result;
  },

  getFileName(type: string, name: string, options?: Record<string, unknown>) {
    return this.addFileExtension(
      [getCurrentYYYYMMDDHHmms(), name ? name : 'unnamed-' + type].join('-'),
      options
    );
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getFileExtension(options?: Record<string, unknown>) {
    return 'js';
  },

  addFileExtension(basename: string, options?: Record<string, unknown>) {
    return [basename, this.getFileExtension(options)].join('.');
  },

  getMigrationPath(migrationName: string) {
    return path.resolve(
      this.getPath('migration'),
      this.getFileName('migration', migrationName)
    );
  },

  getSeederPath(seederName: string) {
    return path.resolve(
      this.getPath('seeder'),
      this.getFileName('seeder', seederName)
    );
  },

  getModelsPath(): string {
    return (args.modelsPath as string) || path.resolve(process.cwd(), 'models');
  },

  getModelPath(modelName: string) {
    return path.resolve(
      this.getModelsPath(),
      this.addFileExtension(modelName.toLowerCase())
    );
  },

  resolve(packageName: string) {
    let result;

    try {
      result = resolve(packageName, { basedir: process.cwd() });
      result = require(result);
    } catch (e) {
      try {
        result = require(packageName);
      } catch (err) {
        // ignore error
      }
    }

    return result;
  },

  existsSync(pathToCheck: string) {
    if (fs.accessSync) {
      try {
        fs.accessSync(pathToCheck, constants.R_OK);
        return true;
      } catch (e) {
        return false;
      }
    } else {
      return fs.existsSync(pathToCheck);
    }
  },
};
