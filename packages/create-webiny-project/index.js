#!/usr/bin/env node
const { red, green, blue, bold, cyan } = require("chalk");
const envinfo = require("envinfo");
const execa = require("execa");
const fs = require("fs-extra");
const Listr = require("listr");
const os = require("os");
const path = require("path");
const yargs = require("yargs");
const indentString = require("indent-string");
const validateProjectName = require("validate-npm-package-name");

// Add indentation to console.log output
const log = console.log;
console.log = (first = "", ...args) => {
    if (typeof first === "string") {
        log(indentString(first, 2), ...args);
    } else {
        log(first, ...args);
    }
};

const packageJson = require("./package.json");
const init = require("./init.js");
const rimraf = require("rimraf");

yargs
    .usage("Usage: $0 <project-name> [options]")
    .version(packageJson.version)
    .demandCommand(1)
    .help()
    .alias("help", "h")
    .fail(function(msg, err) {
        if (msg) {
            console.log(msg);
        }
        if (err) {
            console.log(err);
        }
        process.exit(1);
    });

yargs.command(
    "$0 <project-name> [options]",
    "Name of application and template to use",
    yargs => {
        yargs.positional("project-name", {
            describe: "Project name"
        });
        yargs.option("template", {
            describe:
                "Name of template to use, if no template is provided it will default to 'full' template",
            alias: "t",
            type: "string",
            default: "full",
            demandOption: false
        });
        yargs.option("tag", {
            describe: "NPM tag to use for @webiny packages",
            type: "string",
            default: "latest",
            demandOption: false
        });
        yargs.option("log", {
            describe:
                "Creates a log file to see output of installation. Defaults to creating cwp-logs.txt in current directory.",
            alias: "l",
            type: "string",
            demandOption: false
        });
        yargs.example("$0 <project-name>");
        yargs.example("$0 <project-name> --template=cms");
        yargs.example("$0 <project-name> --template=../path/to/template");
        yargs.example("$0 <project-name> --log=./my-logs.txt");
    },
    argv => createApp(argv)
).argv;

yargs.command("info", "Print environment debug information", {}, () => informationHandler()).argv;

function checkAppName(appName) {
    const validationResult = validateProjectName(appName);
    if (!validationResult.validForNewPackages) {
        console.error(
            red(
                `Cannot create a project named ${green(
                    `"${appName}"`
                )} because of npm naming restrictions:\n`
            )
        );
        [...(validationResult.errors || []), ...(validationResult.warnings || [])].forEach(
            error => {
                console.error(red(`  * ${error}`));
            }
        );
        console.error(red("\nPlease choose a different project name."));
        process.exit(1);
    }
}

async function createApp({ projectName, template, tag, log }) {
    if (!projectName) {
        throw Error("You must provide a name for the project to use.");
    }

    const root = path.resolve(projectName);
    const appName = path.basename(root);

    if (fs.existsSync(root)) {
        console.log(`\nSorry, target folder ${red(projectName)} already exists!`);
        process.exit(1);
    }

    // Check if @webiny/cli is installed globally and warn user
    try {
        await execa("npm", ["list", "-g", "@webiny/cli"]);
        console.log(
            [
                "",
                "IMPORTANT NOTICE:",
                "----------------------------------------",
                `We've detected a global installation of ${blue(
                    "@webiny/cli"
                )}. This might not play well with your new project.`,
                `We recommend you do one of the following things:\n`,
                ` - uninstall the global @webiny/cli package by running ${blue(
                    "npm rm -g @webiny/cli"
                )} or`,
                ` - run webiny commands using ${blue(
                    "yarn webiny"
                )} so that the package is always resolved to your project dependencies\n`,
                `The second option is also recommended if you have an older version of Webiny project you want to keep using.`,
                "----------------------------------------",
                ""
            ].join("\n")
        );
    } catch (err) {
        // @webiny/cli is not installed globally
    }

    console.log(`Creating project at ${blue(root)}:`);

    const tasks = new Listr([
        {
            title: "Pre-template setup",
            task: () => {
                return new Listr([
                    {
                        title: "Check project name for valid npm nomenclature",
                        task: () => {
                            checkAppName(appName);
                            fs.ensureDirSync(projectName);
                        }
                    },
                    {
                        title: `Creating your Webiny app in ${green(root)}.`,
                        task: () => {
                            const packageJson = {
                                name: appName,
                                version: "0.1.0",
                                private: true
                            };
                            fs.writeFileSync(
                                path.join(root, "package.json"),
                                JSON.stringify(packageJson, null, 2) + os.EOL
                            );
                        }
                    }
                ]);
            }
        }
    ]);

    tasks.run();

    run({ root, appName, template, tag, log });
}

function informationHandler() {
    console.log(bold("\nEnvironment Info:"));
    console.log(`\n  current version of ${packageJson.name}: ${packageJson.version}`);
    console.log(`  running from ${__dirname}`);
    return envinfo
        .run(
            {
                System: ["OS", "CPU"],
                Binaries: ["Node", "npm", "Yarn"],
                Browsers: ["Chrome", "Edge", "Internet Explorer", "Firefox", "Safari"],
                npmGlobalPackages: ["create-webiny-project"]
            },
            {
                duplicates: true,
                showNotFound: true
            }
        )
        .then(console.log);
}

async function install({ root, dependencies }) {
    const command = "yarn";
    const args = ["add", "--exact"];
    [].push.apply(args, dependencies);
    args.push("--cwd");
    args.push(root);
    try {
        await execa(command, args);
    } catch (err) {
        throw new Error("Unable to install core dependencies for create-webiny-project.", err);
    }
}

async function run({ root, appName, template, tag, log }) {
    const dependencies = [];
    try {
        let templateName = `@webiny/cwp-template-${template}`;

        if (template.startsWith(".") || template.startsWith("file:")) {
            templateName = "file:" + path.relative(appName, template.replace("file:", ""));
        }
        dependencies.push(`${templateName}@${tag}`);
        const tasks = new Listr([
            {
                title: `Install template package`,
                task: async ctx => {
                    try {
                        await install({ root, dependencies });
                    } catch (err) {
                        throw new Error("Failed to install template package", err, ctx);
                    }
                }
            }
        ]);

        await tasks.run().catch(async err => {
            let basePath = path.join("./", "cwp-logs.txt");
            if (log.startsWith(".") || log.startsWitch("file:")) {
                basePath = log;
            }
            fs.writeFileSync(path.join(basePath), JSON.stringify(err, null, 2) + os.EOL);
            console.log("\nCleaning up project...");
            rimraf.sync(root);
            console.log("Project cleaned!");
            process.exit(1);
        });

        await init({ root, appName, templateName, tag, log });
    } catch (reason) {
        console.log("\nAborting installation.");
        if (reason.command) {
            console.log(`  ${cyan(reason.command)} has failed.`);
        } else {
            console.log(red("Unexpected error. Please report it as a bug:"));
            console.log(reason);
        }
        console.log("\nDone.");
        process.exit(1);
    }
}
