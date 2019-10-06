#!/usr/bin/env node
const yargs = require("yargs");

yargs.usage("Usage: $0 <command>").demandCommand(1);

yargs.command(
    "create <name>",
    "Create a new Webiny project",
    yargs => {
        yargs.positional("name", {
            describe: "Project name"
        });
    },
    argv => {
        require("./create")(argv);
    }
);

// Run
yargs.argv;
