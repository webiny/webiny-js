#!/usr/bin/env node
const yargs = require("yargs");

// Disable help processing until after plugins are imported.
yargs.help(false);

// Loads environment variables from multiple sources.
require("./utils/loadEnvVariables");

const { blue, red } = require("chalk");
const context = require("./context");
const { createCommands } = require("./commands");

yargs
    .usage("Usage: $0 <command> [options]")
    .demandCommand(1)
    .recommendCommands()
    .scriptName("webiny")
    .epilogue(
        `To find more information, docs and tutorials, see ${blue("https://www.webiny.com/docs")}.`
    )
    .epilogue(`Want to contribute? ${blue("https://github.com/webiny/webiny-js")}.`)
    .fail(function (msg, error, yargs) {
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

        if (error) {
            // Unfortunately, yargs doesn't provide passed args here, so we had to do it via process.argv.
            console.log();
            if (process.argv.includes("--debug")) {
                context.debug(error);
            } else {
                context.error(error.message);
            }

            const plugins = context.plugins.byType("cli-command-error");
            for (let i = 0; i < plugins.length; i++) {
                const plugin = plugins[i];
                plugin.handle({
                    error,
                    context
                });
            }
        }

        process.exit(1);
    });

(async () => {
    await createCommands(yargs, context);
    // Enable help and run the CLI.
    yargs.help().argv;
})();
