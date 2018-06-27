#!/usr/bin/env node
require("dotenv").config();
const yargs = require("yargs");

// Remove for production development
require("babel-register");

yargs.command(
    "deploy <type> <folder>",
    "deploy folder",
    yargs => {
        yargs.positional("type", {
            describe: "app type"
        });

        yargs.positional("folder", {
            describe: "folder to deploy"
        });
    },
    argv => {
        require("./handlers/deploy").default(argv);
    }
);

// Run
yargs.argv;
