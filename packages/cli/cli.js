#!/usr/bin/env node
const yargs = require("yargs");
const { blue } = require("chalk");
const indentString = require("indent-string");

// Add indentation to console.log output
const log = console.log;
console.log = (first = "", ...args) => {
    if (typeof first === "string") {
        log(indentString(first, 2), ...args);
    } else {
        log(first, ...args);
    }
};

const { createCommands } = require("./commands");
const context = require("./context");

yargs
    .usage("Usage: $0 <command> [options]")
    .demandCommand(1)
    .recommendCommands()
    .epilogue(
        `To find more information, docs and tutorials, see ${blue("https://docs.webiny.com")}.`
    )
    .epilogue(`Want to contribute? ${blue("https://github.com/webiny/webiny-js")}.`)
    .fail(function(msg, err) {
        if (msg) {
            console.log(msg);
        }
        if (err) {
            console.log(err);
        }
        process.exit(1);
    });

createCommands(yargs, context);

// Run
yargs.argv;
