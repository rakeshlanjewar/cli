import path from 'path';
import _ from 'lodash';
import configHelper from './config-helper';
import { MigratorType } from '../types';

const storage: Record<MigratorType, string> = {
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
  getStorageOption(property: string, fallback: string | boolean | undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (configHelper.readConfig() as any)[property] || fallback;
  },

  getStorage(type: MigratorType) {
    return this.getStorageOption(type + 'Storage', storage[type]);
  },

  getStoragePath(type: keyof typeof storageJsonName) {
    const fallbackPath = path.join(process.cwd(), storageJsonName[type]);

    return this.getStorageOption(type + 'StoragePath', fallbackPath);
  },

  getTableName(type: keyof typeof storageTableName) {
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

  getTimestamps(type: string) {
    return this.getStorageOption(type + 'Timestamps', timestampsDefault);
  },

  getStorageOptions(type: MigratorType, extraOptions: Record<string, unknown>) {
    const options: {
      path?: string;
      tableName?: string;
      schema?: string;
      timestamps?: string;
    } = {};

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
