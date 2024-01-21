import path from 'path';
const resolve = require('resolve').sync;
import getYArgs from '../core/yargs';
import { QueryOptions, Sequelize } from 'sequelize';

const args = getYArgs().argv;

export default {
  getEnvironment: () => {
    return (args.env as string) || process.env.NODE_ENV || 'development';
  },

  getSequelize: (file?: string) => {
    const resolvePath = file ? path.join('sequelize', file) : 'sequelize';
    const resolveOptions = { basedir: process.cwd() };

    let sequelizePath;

    try {
      sequelizePath = require.resolve(resolvePath, {
        paths: [resolveOptions.basedir],
      });
    } catch (e) {
      // ignore error
    }

    try {
      sequelizePath = sequelizePath || resolve(resolvePath, resolveOptions);
    } catch (e) {
      console.error('Unable to resolve sequelize package in ' + process.cwd());
      process.exit(1);
    }

    return require(sequelizePath);
  },

  execQuery: (sequelize: Sequelize, sql: string, options: QueryOptions) => {
    return sequelize.query(sql, options);
  },
};
