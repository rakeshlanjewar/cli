import path from 'path';
import fs from 'fs';
import url from 'url';
import _ from 'lodash';
import { promisify } from 'util';
import getYArgs from '../core/yargs';
import importHelper from './import-helper';
import process from 'process';
import pathHelper from './path-helper';
import assetHelper from './asset-helper';
import genericHelper from './generic-helper';
import viewHelper from './view-helper';

const args: any = getYArgs().argv;

export default {
  config: undefined,
  rawConfig: undefined,
  error: undefined,
  async init() {
    let config;

    try {
      if (args.url) {
        config = this.parseDbUrl(args.url);
      } else {
        const module = await importHelper.importModule(this.getConfigFile());
        config = await module.default;
      }
    } catch (e) {
      this.error = e;
    }

    if (typeof config === 'function') {
      // accepts callback parameter
      if (config.length === 1) {
        config = await promisify(config)();
      } else {
        // returns a promise.
        config = await config();
      }
    }

    this.rawConfig = config;

    return this;
  },
  getConfigFile() {
    if (args.config) {
      return path.resolve(process.cwd(), args.config);
    }

    const defaultPath = path.resolve(process.cwd(), 'config', 'config.json');
    const alternativePath = defaultPath.replace('.json', '.js');

    return pathHelper.existsSync(alternativePath)
      ? alternativePath
      : defaultPath;
  },

  relativeConfigFile() {
    return path.relative(process.cwd(), this.getConfigFile());
  },

  configFileExists() {
    return pathHelper.existsSync(this.getConfigFile());
  },

  getDefaultConfig() {
    return (
      JSON.stringify(
        {
          development: {
            username: 'root',
            password: null,
            database: 'database_development',
            host: '127.0.0.1',
            dialect: 'mysql',
          },
          test: {
            username: 'root',
            password: null,
            database: 'database_test',
            host: '127.0.0.1',
            dialect: 'mysql',
          },
          production: {
            username: 'root',
            password: null,
            database: 'database_production',
            host: '127.0.0.1',
            dialect: 'mysql',
          },
        },
        undefined,
        2
      ) + '\n'
    );
  },

  writeDefaultConfig() {
    const configPath = path.dirname(this.getConfigFile());

    if (!pathHelper.existsSync(configPath)) {
      assetHelper.mkdirp(configPath);
    }

    fs.writeFileSync(this.getConfigFile(), this.getDefaultConfig());
  },

  readConfig() {
    if (!this.config) {
      const env = genericHelper.getEnvironment();

      if (this.rawConfig === undefined) {
        throw new Error(
          'Error reading "' +
            this.relativeConfigFile() +
            '". Error: ' +
            this.error
        );
      }

      if (typeof this.rawConfig !== 'object') {
        throw new Error(
          'Config must be an object or a promise for an object: ' +
            this.relativeConfigFile()
        );
      }

      if (args.url) {
        viewHelper.log(
          'Parsed url ' + this.filteredUrl(args.url, this.rawConfig)
        );
      } else {
        viewHelper.log(
          'Loaded configuration file "' + this.relativeConfigFile() + '".'
        );
      }

      if (this.rawConfig[env]) {
        viewHelper.log('Using environment "' + env + '".');

        this.rawConfig = this.rawConfig[env];
      }

      // The Sequelize library needs a function passed in to its logging option
      if (this.rawConfig.logging && !_.isFunction(this.rawConfig.logging)) {
        this.rawConfig.logging = console.log;
      }

      // in case url is present - we overwrite the configuration
      if (this.rawConfig.url) {
        this.rawConfig = _.merge(
          this.rawConfig,
          this.parseDbUrl(this.rawConfig.url)
        );
      } else if (this.rawConfig.use_env_variable) {
        this.rawConfig = _.merge(
          this.rawConfig,
          this.parseDbUrl(process.env[this.rawConfig.use_env_variable])
        );
      }

      this.config = this.rawConfig;
    }
    return this.config;
  },

  filteredUrl(uri, config) {
    const regExp = new RegExp(':?' + _.escapeRegExp(config.password) + '@');
    return uri.replace(regExp, ':*****@');
  },

  urlStringToConfigHash(urlString) {
    try {
      const urlParts = url.parse(urlString);
      const result: any = {
        database: urlParts.pathname.replace(/^\//, ''),
        host: urlParts.hostname,
        port: urlParts.port,
        protocol: urlParts.protocol.replace(/:$/, ''),
        ssl: urlParts.query ? urlParts.query.indexOf('ssl=true') >= 0 : false,
      };

      if (urlParts.auth) {
        const authParts = urlParts.auth.split(':');
        result.username = authParts[0];
        if (authParts.length > 1) {
          result.password = authParts.slice(1).join(':');
        }
      }

      return result;
    } catch (e) {
      throw new Error('Error parsing url: ' + urlString);
    }
  },

  parseDbUrl(urlString) {
    let config = this.urlStringToConfigHash(urlString);

    config = _.assign(config, {
      dialect: config.protocol,
    });

    if (
      config.dialect === 'sqlite' &&
      config.database.indexOf(':memory') !== 0
    ) {
      config = _.assign(config, {
        storage: '/' + config.database,
      });
    }

    return config;
  },
};
