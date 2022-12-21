#!/usr/bin/env node
const path = require("path");
const yargs = require("yargs");
const { log, getProject } = require("./utils");
const { boolean } = require("boolean");

// Disable help processing until after plugins are imported.
yargs.help(false);

// Immediately load environment variables from following locations:
// - `webiny.project.ts` file
// - `.env.{PASSED_ENVIRONMENT}` file
// - `.env` file

const project = getProject();

// `webiny.project.ts` file.
// Environment variables defined via the `env` property.
if (project.config.env) {
    Object.assign(process.env, project.config.env);
}

// Feature flags defined via the `featureFlags` property.
if (project.config.featureFlags) {
    process.env.WEBINY_FEATURE_FLAGS = JSON.stringify(project.config.featureFlags);
    process.env.REACT_APP_WEBINY_FEATURE_FLAGS = JSON.stringify(project.config.featureFlags);
}

// `.env.{PASSED_ENVIRONMENT}` and `.env` files.
let paths = [path.join(project.root, ".env")];

if (yargs.argv.env) {
    paths.push(path.join(project.root, `.env.${yargs.argv.env}`));
}

// Let's load environment variables
for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const { error } = require("dotenv").config({ path });
    if (boolean(yargs.argv.debug)) {
        if (error) {
            log.debug(`No environment file found on ${log.debug.hl(path)}.`);
        } else {
            log.success(`Successfully loaded environment variables from ${log.success.hl(path)}.`);
        }
    }
}

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
            context.error(error.message);
            // Unfortunately, yargs doesn't provide passed args here, so we had to do it via process.argv.
            if (process.argv.includes("--debug")) {
                context.debug(error);
            }

            console.log();
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
