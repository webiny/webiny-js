#!/usr/bin/env node
const yargs = require("yargs");
const { createCommands } = require("./scripts/index");

createCommands(yargs);

// Run
yargs.argv;