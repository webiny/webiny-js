#!/usr/bin/env node
const yargs = require("yargs");
const { blue, green } = require("chalk");
const { createCommands } = require("./commands");

const trackingNotice = () => {
    console.log();
    console.log(
        `Webiny collects anonymous usage analytics to help improve the developer experience.`
    );
    console.log(`If you'd like to opt-out run ${green("webiny disable-tracking")}.`);
    console.log(`To learn more, check out https://www.webiny.com/telemetry/.`);
    console.log();
};

createCommands(yargs);

yargs
    .usage("Usage: $0 <command>")
    .demandCommand(1)
    .recommendCommands()
    .example("$0 deploy api --env=dev")
    .example("$0 remove api --env=dev")
    .epilogue(
        `To find more information, docs and tutorials, see ${blue("https://docs.webiny.com")}.`
    )
    .epilogue(`Want to contribute? ${blue("https://github.com/webiny/webiny-js")}.`)
    .fail(function(msg, err) {
        if (msg) console.log(msg);
        if (err) console.log(err);
        process.exit(1);
    });

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
        trackingNotice();
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