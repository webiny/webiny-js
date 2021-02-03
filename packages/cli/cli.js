#!/usr/bin/env node
const yargs = require("yargs");
const { blue, red } = require("chalk");
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
    .fail(function(msg, err, yargs) {
        if (msg) {
            if (msg.includes("Not enough non-option arguments")) {
                console.log();
                context.error(red("Command was not invoked as expected!"));
                context.info(
                    `Some non-optional arguments are missing. See the usage examples printed below.`
                );
                console.log();
                yargs.showHelp();
                return;
            }

            if (msg.includes("Missing required argument")) {
                const args = msg
                    .split(":")[1]
                    .split(",")
                    .map(v => v.trim());

                console.log();
                context.error(red("Command was not invoked as expected!"));
                context.info(
                    `Missing required argument(s): ${args
                        .map(arg => red(arg))
                        .join(", ")}. See the usage examples printed below.`
                );
                console.log();
                yargs.showHelp();
                return;
            }
            console.log();
            context.error(red("Command execution was aborted!"));
            context.error(msg);
            console.log();

            process.exit(1);
        }

        if (err) {
            context.error(err.message);
            // Unfortunately, yargs doesn't provide passed args here, so we had to do it via process.argv.
            if (process.argv.includes("--debug")) {
                context.debug(err);
            }
        }

        process.exit(1);
    });

createCommands(yargs, context);

// Run
yargs.argv;
