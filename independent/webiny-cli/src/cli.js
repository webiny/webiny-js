#!/usr/bin/env node
const yargs = require("yargs");

yargs.command("init", "Initialize a new Webiny project", argv => {
    require("./init")(argv);
});

yargs.command(
    "deploy",
    `Deploy an app or a function from the given folder.\nWARNING: Always run from the project root folder.`,
    yargs => {
        yargs.option("folder", {
            describe: "Folder to deploy (relative to the project root)."
        });
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
