#!/usr/bin/env node
/**
 * Webiny CLI - a command line interface for common development tasks (eg. creating a new app, entity ...).
 * Before adding new commands, check out some of the existing ones.
 */
require("yargs")
    .usage(`Usage: webiny <command>`)
    .demandCommand()
    .recommendCommands()
    .strict()
    .command(require("./commands/create"))
    .command(require("./commands/entity"))
    .help("h")
    .alias("h", "help")
    .version("v")
    .alias("v", "version").argv;
