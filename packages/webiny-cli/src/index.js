#!/usr/bin/env node
// @flow
/**
 * Webiny CLI - a command line interface for common development tasks (eg. creating a new app, entity ...).
 * Before adding new commands, check out some of the existing ones.
 */
const yargs = require("yargs");
yargs
    .usage(`Usage: webiny <command>`)
    .demandCommand()
    .recommendCommands()
    .strict()
    .command(require("./commands/create"))
    .command(require("./commands/entity"))
    .help("h")
    .alias("h", "help")
    .version("v")
    .alias("v", "version");

// Run
yargs.argv;
