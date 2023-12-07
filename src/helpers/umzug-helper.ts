import path from 'path';
import _ from 'lodash';
import process from 'process';
import configHelper from './config-helper';

const storage = {
  migration: 'sequelize',
  seeder: 'none',
};
const storageTableName = {
  migration: 'SequelizeMeta',
  seeder: 'SequelizeData',
};
const storageJsonName = {
  migration: 'sequelize-meta.json',
  seeder: 'sequelize-data.json',
};

let timestampsDefault = false;

export default {
  getStorageOption(property, fallback) {
    return configHelper.readConfig()[property] || fallback;
  },

  getStorage(type) {
    return this.getStorageOption(type + 'Storage', storage[type]);
  },

  getStoragePath(type) {
    const fallbackPath = path.join(process.cwd(), storageJsonName[type]);

    return this.getStorageOption(type + 'StoragePath', fallbackPath);
  },

  getTableName(type) {
    return this.getStorageOption(
      type + 'StorageTableName',
      storageTableName[type]
    );
  },

  getSchema(type?: string) {
    return this.getStorageOption(type + 'StorageTableSchema', undefined);
  },

  enableTimestamps() {
    timestampsDefault = true;
  },

  getTimestamps(type) {
    return this.getStorageOption(type + 'Timestamps', timestampsDefault);
  },

  getStorageOptions(type, extraOptions) {
    const options: any = {};

    if (this.getStorage(type) === 'json') {
      options.path = this.getStoragePath(type);
    } else if (this.getStorage(type) === 'sequelize') {
      options.tableName = this.getTableName(type);
      options.schema = this.getSchema(type);
      options.timestamps = this.getTimestamps(type);
    }

    _.assign(options, extraOptions);

    return options;
  },
};
