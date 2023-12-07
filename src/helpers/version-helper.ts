import path from 'path';
import genericHelper from './generic-helper';
import configHelper from './config-helper';

const packageJson = require(path.resolve(
  __dirname,
  '..',
  '..',
  'package.json'
));

export default {
  getCliVersion() {
    return packageJson.version;
  },

  getOrmVersion() {
    return genericHelper.getSequelize('package.json').version;
  },

  getDialect() {
    try {
      return configHelper.readConfig();
    } catch (e) {
      return null;
    }
  },

  getDialectName() {
    const config = this.getDialect();

    if (config) {
      return {
        sqlite: 'sqlite3',
        postgres: 'pg',
        postgresql: 'pg',
        mariadb: 'mariasql',
        mysql: 'mysql',
      }[config.dialect];
    } else {
      return null;
    }
  },

  getNodeVersion() {
    return process.version.replace('v', '');
  },
};
