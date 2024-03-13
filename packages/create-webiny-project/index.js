#!/usr/bin/env node
const yargs = require("yargs");
const packageJson = require("./package.json");
const createProject = require("./utils/createProject");

process.on("unhandledRejection", err => {
    throw err;
});

yargs
    .usage("Usage: create-webiny-project <project-name> [options]")
    .version(packageJson.version)
    .demandCommand(1)
    .help()
    .alias("help", "h")
    .scriptName("create-webiny-project")
    .fail(function (msg, err) {
        if (msg) {
            console.log(msg);
        }
        if (err) {
            console.log(err);
        }
        process.exit(1);
    });

// noinspection BadExpressionStatementJS
yargs.command(
    "$0 <project-name> [options]",
    "Name of application and template to use",
    yargs => {
        yargs.positional("project-name", {
            describe: "Project name"
        });
        yargs.option("force", {
            describe: "All project creation within an existing folder",
            default: false,
            type: "boolean",
            demandOption: false
        });
        yargs.option("template", {
            describe: `Name of template to use, if no template is provided it will default to "aws" template`,
            alias: "t",
            type: "string",
            default: "aws",
            demandOption: false
        });
        yargs.option("template-options", {
            describe: `A JSON containing template-specific options (usually used in non-interactive environments)`,
            default: null,
            type: "string",
            demandOption: false
        });
        yargs.option("assign-to-yarnrc", {
            describe: `A JSON containing additional options that will be assigned into the "yarnrc.yml" configuration file`,
            default: null,
            type: "string",
            demandOption: false
        });
        yargs.option("tag", {
            describe: "NPM tag to use for @webiny packages",
            type: "string",
            default: "latest",
            demandOption: false
        });
        yargs.option("interactive", {
            describe: "Enable interactive mode for all commands",
            default: true,
            type: "boolean",
            demandOption: false
        });
        yargs.option("log", {
            describe:
                "Creates a log file to see output of installation. Defaults to creating cwp-logs.txt in current directory",
            alias: "l",
            default: "create-webiny-project-logs.txt",
            type: "string",
            demandOption: false
        });
        yargs.option("cleanup", {
            describe: "If an error occurs upon project creation, deletes all generated files",
            alias: "c",
            default: true,
            type: "boolean",
            demandOption: false
        });

        yargs.example("$0 <project-name>");
        yargs.example("$0 <project-name> --template=aws");
        yargs.example("$0 <project-name> --template=../path/to/template");
        yargs.example("$0 <project-name> --log=./my-logs.txt");
    },
    argv => createProject(argv)
).argv;
