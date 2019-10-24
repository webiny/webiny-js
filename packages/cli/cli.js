#!/usr/bin/env node
const yargs = require("yargs");
const { blue, green, dim, magenta } = require("chalk");

yargs
    .usage("Usage: $0 <command>")
    .demandCommand(1)
    .example("$0 deploy-api --env=dev --debug")
    .example("$0 remove-api --env=dev --debug")
    .epilogue(
        `To find more information, docs and tutorials, see ${blue("https://docs.webiny.com")}.`
    )
    .epilogue(`Want to contribute? ${blue("https://github.com/webiny/webiny-js")}.`)
    .fail(function(msg, err) {
        if (msg) console.log(msg);
        if (err) throw err;
        process.exit(1);
    });

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
    "deploy-api",
    `Deploy API from ${green("api")} folder.\n${dim("(NOTE: run from project root)")}`,
    yargs => {
        yargs.option("env", {
            describe: "Environment to deploy. Must match your environments in .env.json.",
            default: "local"
        });
        yargs.option("debug", {
            describe: "Show debug messages.",
            default: false,
            type: "boolean"
        });
    },
    async argv => {
        await require("./sls/deploy")({ ...argv, what: "api" });
        process.exit(0);
    }
);

yargs.command(
    "deploy-apps",
    `Deploy Apps from ${green("apps")} folder.\n${dim("(NOTE: run from project root)")}`,
    yargs => {
        yargs.option("env", {
            describe: `Environment to deploy. Must match an environment in .env.json. \nNOTE: "local" environment is reserved for local development.`
        });
        yargs.option("debug", {
            describe: "Show debug messages.",
            default: false,
            type: "boolean"
        });
    },
    async argv => {
        await require("./sls/deploy")({ ...argv, what: "apps" });
        process.exit(0);
    }
);

yargs.command(
    "remove-api",
    `Remove API.\n${dim("(NOTE: run from project root)")}`,
    yargs => {
        yargs.option("env", {
            describe: "Environment to remove.",
            default: "local"
        });
        yargs.option("debug", {
            describe: "Show debug messages.",
            default: false,
            type: "boolean"
        });
    },
    async argv => {
        await require("./sls/remove")({ ...argv, what: "api" });
        process.exit(0);
    }
);

yargs.command(
    "remove-apps",
    `Remove Apps.\n${dim("(NOTE: run from project root)")}`,
    yargs => {
        yargs.option("env", {
            describe: `Environment to remove. Must match an environment in .env.json.`,
            default: "dev"
        });
        yargs.option("debug", {
            describe: "Show debug messages.",
            default: false,
            type: "boolean"
        });
    },
    async argv => {
        await require("./sls/remove")({ ...argv, what: "apps" });
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
