#!/usr/bin/env node
const yargs = require("yargs");
const { createCommands } = require("./scripts/index");

yargs.showHelpOnFail(false);
createCommands(yargs);

// Run
yargs.argv;
