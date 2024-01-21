import { Umzug } from 'umzug';
import _ from 'lodash';
import genericHelper from '../helpers/generic-helper';
import viewHelper from '../helpers/view-helper';
import configHelper from '../helpers/config-helper';
import umzugHelper from '../helpers/umzug-helper';
import pathHelper from '../helpers/path-helper';
import versionHelper from '../helpers/version-helper';
import { QueryInterface } from 'sequelize';
import { MigratorType } from '../types';

const Sequelize = genericHelper.getSequelize();

export function logMigrator(s: string) {
  if (s.indexOf('Executing') !== 0) {
    viewHelper.log(s);
  }
}

function getSequelizeInstance() {
  let config = null;

  try {
    config = configHelper.readConfig();
  } catch (e) {
    viewHelper.error(e as Error);
  }

  config = _.defaults(config, { logging: logMigrator });

  try {
    return new Sequelize(config);
  } catch (e) {
    viewHelper.error(e as Error);
  }
}

export async function getMigrator(
  type: MigratorType,
  args: { url?: string }
): Promise<Umzug> {
  if (!(configHelper.configFileExists() || args.url)) {
    viewHelper.error(
      `Cannot find "${configHelper.getConfigFile()}". Have you run "sequelize init"?`
    );
    process.exit(1);
  }

  const sequelize = getSequelizeInstance();
  const migrator = new Umzug({
    storage: umzugHelper.getStorage(type),
    // storageOptions: umzugHelper.getStorageOptions(type, { sequelize }),
    // logging: 'error',
    logger: undefined,
    migrations: {
      glob: ['*.cjs|js|cts|ts', { cwd: pathHelper.getPath(type) }],
    },
    context: { migration: sequelize.getQueryInterface(), Sequelize: Sequelize },
    // migrations: {
    //   params: [sequelize.getQueryInterface(), Sequelize],
    //   path: pathHelper.getPath(type) as string,
    //   pattern: /^(?!.*\.d\.ts$).*\.(cjs|js|cts|ts)$/,
    // },
  });

  return sequelize
    .authenticate()
    .then(() => {
      // Check if this is a PostgreSQL run and if there is a custom schema specified, and if there is, check if it's
      // been created. If not, attempt to create it.
      if (versionHelper.getDialectName() === 'pg') {
        const customSchemaName = umzugHelper.getSchema('migration');
        if (customSchemaName && customSchemaName !== 'public') {
          return sequelize.createSchema(customSchemaName);
        }
      }
    })
    .then(() => migrator)
    .catch((e: Error) => viewHelper.error(e));
}

export function ensureCurrentMetaSchema(migrator: Umzug) {
  const queryInterface =
    migrator.options.storageOptions.sequelize.getQueryInterface();
  const tableName = migrator.options.storageOptions.tableName;
  const columnName = migrator.options.storageOptions.columnName;

  return ensureMetaTable(queryInterface, tableName)
    .then((table) => {
      const columns = Object.keys(table);

      if (columns.length === 1 && columns[0] === columnName) {
        return;
      } else if (columns.length === 3 && columns.indexOf('createdAt') >= 0) {
        // If found createdAt - indicate we have timestamps enabled
        umzugHelper.enableTimestamps();
        return;
      }
    })
    .catch(() => {});
}

function ensureMetaTable(queryInterface: QueryInterface, tableName: string) {
  return queryInterface.showAllTables().then((tableNames) => {
    if (tableNames.indexOf(tableName) === -1) {
      throw new Error('No MetaTable table found.');
    }
    return queryInterface.describeTable(tableName);
  });
}

/**
 * Add timestamps
 *
 * @return {Promise}
 */
export function addTimestampsToSchema(migrator: Umzug) {
  const sequelize = migrator.options.storageOptions.sequelize;
  const queryInterface = sequelize.getQueryInterface();
  const tableName = migrator.options.storageOptions.tableName;

  return ensureMetaTable(queryInterface, tableName).then((table) => {
    if (table.createdAt) {
      return;
    }

    return ensureCurrentMetaSchema(migrator)
      .then(() => queryInterface.renameTable(tableName, tableName + 'Backup'))
      .then(() => {
        const queryGenerator =
          queryInterface.QueryGenerator || queryInterface.queryGenerator;
        const sql = queryGenerator.selectQuery(tableName + 'Backup');
        return genericHelper.execQuery(sequelize, sql, {
          type: 'SELECT',
          raw: true,
        });
      })
      .then((result) => {
        const SequelizeMeta = sequelize.define(
          tableName,
          {
            name: {
              type: Sequelize.STRING,
              allowNull: false,
              unique: true,
              primaryKey: true,
              autoIncrement: false,
            },
          },
          {
            tableName,
            timestamps: true,
            schema: umzugHelper.getSchema(),
          }
        );

        return SequelizeMeta.sync().then(() => {
          return SequelizeMeta.bulkCreate(result);
        });
      });
  });
}
