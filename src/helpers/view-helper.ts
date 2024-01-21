import clc from 'cli-color';
import _ from 'lodash';
import getYArgs from '../core/yargs';
import versionHelper from './version-helper';

const args = getYArgs().argv;

export default {
  teaser() {
    const versions = [
      'Node: ' + versionHelper.getNodeVersion(),
      'CLI: ' + versionHelper.getCliVersion(),
      'ORM: ' + versionHelper.getOrmVersion(),
    ];

    this.log();
    this.log(clc.underline('Sequelize CLI [' + versions.join(', ') + ']'));
    this.log();
  },

  log(...s: string[]) {
    console.log.apply(this, s);
  },

  error(error: Error | string) {
    let message;
    // const extraMessages = [];

    if (error instanceof Error) {
      message = !args.debug ? error.message : error.stack;
    }

    // if (args.debug && error.original) {
    //   extraMessages.push(error.original.message);
    // }

    this.log();
    console.error(`${clc.red('ERROR:')} ${message}`);
    // if (error.original && error.original.detail) {
    //   console.error(`${clc.red('ERROR DETAIL:')} ${error.original.detail}`);
    // }

    // extraMessages.forEach((message) =>
    //   console.error(`${clc.red('EXTRA MESSAGE:')} ${message}`)
    // );
    this.log();

    process.exit(1);
  },

  warn(message: string) {
    this.log(`${clc.yellow('WARNING:')} ${message}`);
  },

  notifyAboutExistingFile(file: string) {
    this.error(
      'The file ' +
        clc.blueBright(file) +
        ' already exists. ' +
        'Run command with --force to overwrite it.'
    );
  },

  pad(s: string, smth: object | number) {
    let margin = smth;

    if (_.isObject(margin)) {
      margin = Object.keys(margin);
    }

    if (Array.isArray(margin)) {
      margin = Math.max.apply(
        null,
        margin.map((o) => {
          return o.length;
        })
      );
    }

    return s + new Array((margin as number) - s.length + 1).join(' ');
  },
};
