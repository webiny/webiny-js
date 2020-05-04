#!/usr/bin/env node
const yargs = require("yargs");
const { blue } = require("chalk");
const { createCommands } = require("./commands");
const context = require("./context");

yargs
    .usage("Usage: $0 <command> [options]")
    .demandCommand(1)
    .recommendCommands()
    .example("$0 deploy api --env=dev")
    .example("$0 remove api --env=dev")
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

yargs.command(
    "create <name>",
    "Create a new Webiny project.",
    yargs => {
        yargs.positional("name", {
            describe: "Project name"
        });
        yargs.option("tag", {
            describe: `Dist tag of Webiny to use. Default: ${blue("latest")} `,
            default: "latest"
        });
    },
    argv => {
        require("./create")(argv);
    }
);

// Run
yargs.argv;

// Checks for updates
if (!process.env.CI) {
    const updateNotifier = require("update-notifier");
    const pkg = require("./package.json");
    updateNotifier({ pkg }).notify();
}
