#!/usr/bin/env node

import getYArgs from './core/yargs';

const yargs = getYArgs();

import init from './commands/init';
import migrate from './commands/migrate';
import migrateUndo from './commands/migrate_undo';
import migrateUndoAll from './commands/migrate_undo_all';
import seed from './commands/seed';
import seedOne from './commands/seed_one';
import migrationGenerate from './commands/migration_generate';
import modelGenerate from './commands/model_generate';
import seedGenerate from './commands/seed_generate';
import database from './commands/database';
import viewHelper from './helpers/view-helper';

viewHelper.teaser();

yargs
  .help()
  .version()
  .command(
    'db:migrate',
    'Run pending migrations',
    migrate.builder,
    migrate.handler
  )
  .command(
    'db:migrate:schema:timestamps:add',
    'Update migration table to have timestamps',
    migrate.builder,
    migrate.handler
  )
  .command(
    'db:migrate:status',
    'List the status of all migrations',
    migrate.builder,
    migrate.handler
  )
  .command(
    'db:migrate:undo',
    'Reverts a migration',
    migrateUndo.builder,
    migrateUndo.handler
  )
  .command(
    'db:migrate:undo:all',
    'Revert all migrations ran',
    migrateUndoAll.builder,
    migrateUndoAll.handler
  )
  .command('db:seed', 'Run specified seeder', seedOne.builder, seedOne.handler)
  .command(
    'db:seed:undo',
    'Deletes data from the database',
    seedOne.builder,
    seedOne.handler
  )
  .command('db:seed:all', 'Run every seeder', seed.builder, seed.handler)
  .command(
    'db:seed:undo:all',
    'Deletes data from the database',
    seed.builder,
    seed.handler
  )
  .command(
    'db:create',
    'Create database specified by configuration',
    database.builder,
    database.handler
  )
  .command(
    'db:drop',
    'Drop database specified by configuration',
    database.builder,
    database.handler
  )
  .command('init', 'Initializes project', init.builder, init.handler)
  .command(
    'init:config',
    'Initializes configuration',
    init.builder,
    init.handler
  )
  .command(
    'init:migrations',
    'Initializes migrations',
    init.builder,
    init.handler
  )
  .command('init:models', 'Initializes models', init.builder, init.handler)
  .command('init:seeders', 'Initializes seeders', init.builder, init.handler)
  .command(
    'migration:generate',
    'Generates a new migration file',
    migrationGenerate.builder,
    migrationGenerate.handler
  )
  .command(
    'migration:create',
    'Generates a new migration file',
    migrationGenerate.builder,
    migrationGenerate.handler
  )
  .command(
    'model:generate',
    'Generates a model and its migration',
    modelGenerate.builder,
    modelGenerate.handler
  )
  .command(
    'model:create',
    'Generates a model and its migration',
    modelGenerate.builder,
    modelGenerate.handler
  )
  .command(
    'seed:generate',
    'Generates a new seed file',
    seedGenerate.builder,
    seedGenerate.handler
  )
  .command(
    'seed:create',
    'Generates a new seed file',
    seedGenerate.builder,
    seedGenerate.handler
  )
  .wrap(yargs.terminalWidth())
  .demandCommand(1, 'Please specify a command')
  .help()
  .strict()
  .recommendCommands().argv;
