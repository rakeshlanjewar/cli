import { _baseOptions } from '../core/yargs';
import { logMigrator } from '../core/migrator';
import { cloneDeep, defaults, pick } from 'lodash';
import clc from 'cli-color';
import { Argv } from 'yargs';
import genericHelper from '../helpers/generic-helper';
import configHelper, { ParsedUrlConfig } from '../helpers/config-helper';
import viewHelper from '../helpers/view-helper';
import { Sequelize } from 'sequelize';

const SequelizeInstance = genericHelper.getSequelize();

interface QueryGenerator {
  quoteIdentifier: (identifier: string) => string;
}

const builder = (yargs: Argv) =>
  _baseOptions(yargs)
    .option('charset', {
      describe: 'Pass charset option to dialect, MYSQL only',
      type: 'string',
    })
    .option('collate', {
      describe: 'Pass collate option to dialect',
      type: 'string',
    })
    .option('encoding', {
      describe: 'Pass encoding option to dialect, PostgreSQL only',
      type: 'string',
    })
    .option('ctype', {
      describe: 'Pass ctype option to dialect, PostgreSQL only',
      type: 'string',
    })
    .option('template', {
      describe: 'Pass template option to dialect, PostgreSQL only',
      type: 'string',
    }).argv;

const handler = async function (args: ReturnType<typeof builder>) {
  const command = args._[0];

  // legacy, gulp used to do this
  await configHelper.init();

  const sequelize = getDatabaseLessSequelize();
  const config = configHelper.readConfig();
  const options = pick(args, [
    'charset',
    'collate',
    'encoding',
    'ctype',
    'template',
  ]);

  const queryInterface = sequelize.getQueryInterface();
  const queryGenerator =
    queryInterface.queryGenerator || queryInterface.QueryGenerator;

  const query = getCreateDatabaseQuery(sequelize, config, options);

  switch (command) {
    case 'db:create':
      await sequelize
        .query(query, {
          type: sequelize.QueryTypes.RAW,
        })
        .catch((e: Error) => viewHelper.error(e));

      viewHelper.log('Database', clc.blueBright(config.database), 'created.');

      break;
    case 'db:drop':
      await sequelize
        .query(
          `DROP DATABASE IF EXISTS ${queryGenerator.quoteIdentifier(
            config.database
          )}`,
          {
            type: sequelize.QueryTypes.RAW,
          }
        )
        .catch((e: Error) => viewHelper.error(e));

      viewHelper.log('Database', clc.blueBright(config.database), 'dropped.');

      break;
  }

  process.exit(0);
};

function getCreateDatabaseQuery(
  sequelize: Sequelize,
  config: ParsedUrlConfig,
  options: {
    encoding?: string;
    collate?: string;
    ctype?: string;
    template?: string;
    charset?: string;
  }
) {
  const queryInterface = sequelize.getQueryInterface();
  const queryGenerator = queryInterface.queryGenerator as QueryGenerator;

  switch (config.dialect) {
    case 'postgres':
    case 'postgres-native':
      return (
        'CREATE DATABASE ' +
        queryGenerator.quoteIdentifier(config.database) +
        (options.encoding
          ? ' ENCODING = ' + queryGenerator.quoteIdentifier(options.encoding)
          : '') +
        (options.collate
          ? ' LC_COLLATE = ' + queryGenerator.quoteIdentifier(options.collate)
          : '') +
        (options.ctype
          ? ' LC_CTYPE = ' + queryGenerator.quoteIdentifier(options.ctype)
          : '') +
        (options.template
          ? ' TEMPLATE = ' + queryGenerator.quoteIdentifier(options.template)
          : '')
      );

    case 'mysql':
      return (
        'CREATE DATABASE IF NOT EXISTS ' +
        queryGenerator.quoteIdentifier(config.database) +
        (options.charset
          ? ' DEFAULT CHARACTER SET ' +
            queryGenerator.quoteIdentifier(options.charset)
          : '') +
        (options.collate
          ? ' DEFAULT COLLATE ' +
            queryGenerator.quoteIdentifier(options.collate)
          : '')
      );

    case 'mssql':
      return (
        "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'" +
        config.database +
        "')" +
        ' BEGIN' +
        ' CREATE DATABASE ' +
        queryGenerator.quoteIdentifier(config.database) +
        (options.collate ? ' COLLATE ' + options.collate : '') +
        ' END;'
      );

    default:
      viewHelper.error(
        `Dialect ${config.dialect} does not support db:create / db:drop commands`
      );
      return (
        'CREATE DATABASE ' + queryGenerator.quoteIdentifier(config.database)
      );
  }
}

function getDatabaseLessSequelize() {
  let config = null;

  try {
    config = configHelper.readConfig();
  } catch (e) {
    viewHelper.error(e as Error);
  }

  config = cloneDeep(config);
  config = defaults(config, { logging: logMigrator });

  switch (config.dialect) {
    case 'postgres':
    case 'postgres-native':
      config.database = 'postgres';
      break;

    case 'mysql':
      delete config.database;
      break;

    case 'mssql':
      config.database = 'master';
      break;

    default:
      viewHelper.error(
        `Dialect ${config.dialect} does not support db:create / db:drop commands`
      );
  }

  try {
    return new SequelizeInstance(config);
  } catch (e) {
    viewHelper.error(e as Error);
  }
}

export default {
  builder,
  handler,
};
