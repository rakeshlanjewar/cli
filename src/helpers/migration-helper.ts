import _ from 'lodash';
import genericHelper from './generic-helper';
import templateHelper from './template-helper';
import modelHelper from './model-helper';
import pathHelper from './path-helper';
import assetHelper from './asset-helper';

const Sequelize = genericHelper.getSequelize();

export default {
  getTableName(modelName: string) {
    return Sequelize.Utils.pluralize(modelName);
  },

  generateTableCreationFileContent(args: {
    name: string;
    attributes: string;
    underscored: boolean;
  }) {
    return templateHelper.render('migrations/create-table.js', {
      tableName: this.getTableName(args.name),
      attributes: modelHelper.transformAttributes(args.attributes),
      createdAt: args.underscored ? 'created_at' : 'createdAt',
      updatedAt: args.underscored ? 'updated_at' : 'updatedAt',
    });
  },

  generateMigrationName(args: { name: string }) {
    return _.trimStart(_.kebabCase('create-' + args.name), '-');
  },

  generateTableCreationFile(args: {
    name: string;
    attributes: string;
    underscored: boolean;
  }) {
    const migrationName = this.generateMigrationName(args);
    const migrationPath = pathHelper.getMigrationPath(migrationName);

    assetHelper.write(
      migrationPath,
      this.generateTableCreationFileContent(args)
    );
  },
};
