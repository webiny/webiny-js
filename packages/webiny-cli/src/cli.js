#!/usr/bin/env node
const yargs = require("yargs");

yargs.command("init", "Initialize a new Webiny project", argv => {
    require("./init")(argv);
});

yargs.command("list-functions", "List all registered functions", () => {
    require("./functions/logFunctions")();
});

yargs.command("install-functions", "Run install script for all functions (if it exists)", () => {
    require("./functions/installFunctions")();
});

yargs.command(
    "start-functions",
    "Start all functions",
    yargs => {
        yargs.option("port", {
            describe: "Port to listen on.",
            default: 9000
        });

        yargs.option("watch", {
            describe: "Watch given paths.",
            default: ""
        });

        yargs.option("inspect", {
            describe: "Enables debugger client listener.",
            default: null
        });
    },
    argv => {
        require("./functions")(argv);
    }
);

yargs.command(
    "start-app <name>",
    "Start app",
    yargs => {
        yargs.positional("name", {
            describe: "App name."
        });
    },
    argv => {
        require("./apps/start")(argv);
    }
);

yargs.command(
    "build-app <name>",
    "Build app",
    yargs => {
        yargs.positional("name", {
            describe: "App name."
        });
    },
    argv => {
        require("./apps/build")(argv);
    }
);

yargs.command(
    "deploy [folder]",
    `Deploy an app or a function from the given folder. If no folder is specified, all apps will be deployed.`,
    yargs => {
        yargs.option("build", {
            describe: "Auto-run build script.",
            default: true
        });
        yargs.option("ci", {
            describe: "Set to 'true' when running in a CI environment.",
            default: false
        });
    },
    async argv => {
        const Deploy = require("./deploy").default;
        const deploy = new Deploy();
        await deploy.deploy(argv);
        process.exit(0);
    }
);

// Run
yargs.argv;
