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

yargs.command(
    "disable-tracking",
    "Disable tracking of Webiny stats.",
    () => {},
    () => {
        const { setTracking } = require("./config");
        setTracking(false);
        console.log("INFO: tracking of Webiny stats is now DISABLED!");
    }
);

yargs.command(
    "enable-tracking",
    "Enable tracking of Webiny stats.",
    () => {},
    () => {
        const { setTracking } = require("./config");
        setTracking(true);
        console.log(
            "INFO: tracking of Webiny stats is now ENABLED! Thank you for helping us with anonymous data 🎉"
        );
    }
);

// Run
yargs.argv;
