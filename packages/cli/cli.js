#!/usr/bin/env node
const yargs = require("yargs");

yargs.usage("Usage: $0 <command>").demandCommand(1);

yargs.command(
    "create <name>",
    "Create a new Webiny project.",
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
    "deploy <what>",
    "Deploy API or Apps.",
    yargs => {
        yargs.positional("what", {
            describe: "What to deploy: api or apps"
        });
        yargs.option("env", {
            describe: "Environment to deploy.",
            default: "local"
        });
    },
    async argv => {
        await require("./sls/deploy")(argv);
        process.exit(0);
    }
);

yargs.command(
    "remove <what>",
    "Remove API or Apps.",
    yargs => {
        yargs.positional("what", {
            describe: "What to remove: api or apps"
        });
        yargs.option("env", {
            describe: "Environment to remove.",
            default: "local"
        });
    },
    async argv => {
        await require("./sls/remove")(argv);
        process.exit(0);
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
