#!/usr/bin/env node
const { red, green, blue } = require("chalk");
const execa = require("execa");
const fs = require("fs-extra");
const Listr = require("listr");
const os = require("os");
const path = require("path");
const yargs = require("yargs");
const indentString = require("indent-string");
const validateProjectName = require("validate-npm-package-name");
const fg = require("fast-glob");
const findUp = require("find-up");
const loadJsonFile = require("load-json-file");
const { sendEvent } = require("@webiny/tracking");
const writeJsonFile = require("write-json-file");
const rimraf = require("rimraf");
const packageJson = require("./package.json");
const { getPackageVersion } = require("./utils");

process.on("unhandledRejection", err => {
    throw err;
});

// Add indentation to console.log output
const log = console.log;
console.log = (first = "", ...args) => {
    if (typeof first === "string") {
        log(indentString(first, 2), ...args);
    } else {
        log(first, ...args);
    }
};

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
            default: "",
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

    const root = path.resolve(projectName).replace(/\\/g, "/");
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

    await sendEvent({ event: "create-webiny-project-start" });

    const tasks = new Listr([
        {
            title: "Pre-template setup",
            task: () => {
                checkAppName(appName);
                fs.ensureDirSync(projectName);

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
        },
        {
            title: `Install template package`,
            task: async context => {
                const dependencies = [];
                let templateName = `@webiny/cwp-template-${template}`;

                if (template.startsWith(".") || template.startsWith("file:")) {
                    templateName = "file:" + path.relative(appName, template.replace("file:", ""));
                    dependencies.push(templateName);
                } else {
                    dependencies.push(`${templateName}@${tag}`);
                }

                context.templateName = templateName;

                const command = "yarn";
                const args = ["add", "--exact"];
                [].push.apply(args, dependencies);
                args.push("--cwd");
                args.push(root);
                await execa(command, args);
            }
        },
        {
            title: "Create project folders",
            task: context => {
                let templateName = context.templateName;
                if (templateName.startsWith("file:")) {
                    templateName = templateName.replace("file:", "");
                }

                const templatePath = path.dirname(
                    require.resolve(path.join(templateName, "package.json"), {
                        paths: [root]
                    })
                );

                context.templatePath = templatePath;

                const templateDir = path.join(templatePath, "template");
                if (fs.existsSync(templateDir)) {
                    fs.copySync(templateDir, root);
                } else {
                    throw new Error(`Could not resolve template: ${green(templateDir)}`);
                }
            }
        },
        {
            title: "Set up project dependencies",
            task: () => {
                const appPackage = require(path.join(root, "package.json"));
                const projectDeps = require(path.join(root, "dependencies.json"));

                Object.assign(appPackage.dependencies, projectDeps.dependencies);

                if (appPackage.devDependencies) {
                    Object.assign(appPackage.devDependencies, projectDeps.devDependencies);
                } else {
                    appPackage.devDependencies = Object.assign({}, projectDeps.devDependencies);
                }

                if (appPackage.workspaces) {
                    Object.assign(appPackage.workspaces, projectDeps.workspaces);
                } else {
                    appPackage.workspaces = Object.assign({}, projectDeps.workspaces);
                }

                if (appPackage.scripts) {
                    Object.assign(appPackage.scripts, projectDeps.scripts);
                } else {
                    appPackage.scripts = Object.assign({}, projectDeps.scripts);
                }

                fs.writeFileSync(
                    path.join(root, "package.json"),
                    JSON.stringify(appPackage, null, 2) + os.EOL
                );
                fs.unlinkSync(path.join(root, "dependencies.json"));
            }
        },
        {
            title: `Initialize git`,
            task: (ctx, task) => {
                try {
                    execa.sync("git", ["--version"]);
                    execa.sync("git", ["init"], { cwd: root });
                    fs.writeFileSync(path.join(root, ".gitignore"), "node_modules/");
                } catch (err) {
                    task.skip("Git repo not initialized", err);
                }
            }
        },
        {
            title: "Get proper package versions",
            task: async () => {
                // Set proper @webiny package versions
                const workspaces = await fg(["**/package.json"], {
                    ignore: ["**/dist/**", "**/node_modules/**", root],
                    cwd: root
                });
                const latestVersion = await getPackageVersion("@webiny/cli", tag);

                for (let i = 0; i < workspaces.length; i++) {
                    const jsonPath = path.join(root, workspaces[i]);
                    const json = await loadJsonFile(jsonPath);
                    const keys = Object.keys(json.dependencies).filter(k =>
                        k.startsWith("@webiny")
                    );
                    const currentDir = jsonPath.match(/(.*)[\/\\]/)[1] || "";

                    const baseTsConfigPath = path
                        .relative(
                            currentDir,
                            findUp.sync("tsconfig.json", {
                                cwd: root
                            })
                        )
                        .replace(/\\/g, "/");

                    // We don't want to modify tsconfig file in the root of the project
                    if (workspaces[i] !== "package.json") {
                        const tsConfigPath = path.join(currentDir, "tsconfig.json");
                        const tsconfig = require(tsConfigPath);
                        tsconfig.extends = baseTsConfigPath;
                        fs.writeFileSync(tsConfigPath, JSON.stringify(tsconfig, null, 2));
                    }

                    keys.forEach(name => {
                        if (tag.startsWith(".")) {
                            // This means `tag` points to the location of all @webiny packages
                            json.dependencies[name] =
                                "link:" +
                                path.relative(
                                    path.dirname(jsonPath),
                                    path.join(process.cwd(), tag, name)
                                );
                        } else {
                            // Use version of @webiny/cli package (we have fixed package versioning)
                            json.dependencies[name] = `^` + latestVersion;
                        }
                    });
                    await writeJsonFile(jsonPath, json);
                }
            }
        },
        {
            title: "Resolve packages",
            task: async () => {
                // Add package resolutions if `tag` is pointing to a local folder.

                // Why? This is very useful when you're testing packages that are not yet published to `npm`.
                // Just run `create-webiny-project my-project --tag=./local/webiny/project/node_modules` and the whole project
                // will be set up to use your local packages via symlinks, so you can develop and test immediately.
                try {
                    if (tag.startsWith(".")) {
                        const webinyPackages = await fg(["@webiny/*"], {
                            cwd: path.join(process.cwd(), tag),
                            onlyDirectories: true
                        });

                        if (webinyPackages.length) {
                            const rootPkg = path.join(root, "package.json");
                            const rootPkgJson = await loadJsonFile(rootPkg);
                            if (!rootPkgJson.resolutions) {
                                rootPkgJson.resolutions = {};
                            }

                            webinyPackages
                                .filter(name => {
                                    // Do not include private packages
                                    const pkgJson = require(path.join(
                                        process.cwd(),
                                        tag,
                                        name,
                                        "package.json"
                                    ));
                                    return !pkgJson.private;
                                })
                                .forEach(name => {
                                    rootPkgJson.dependencies[name] = rootPkgJson.resolutions[name] =
                                        "link:" +
                                        path.relative(root, path.join(process.cwd(), tag, name));
                                });

                            await writeJsonFile(rootPkg, rootPkgJson);
                        }
                    }
                } catch (err) {
                    throw new Error("Unable to resolve packages: " + err.message);
                }
            }
        },
        {
            title: "Install dependencies",
            task: async context => {
                try {
                    const options = {
                        cwd: root,
                        maxBuffer: "500_000_000"
                    };
                    let logStream;
                    if (log) {
                        logStream = fs.createWriteStream(context.logPath);
                        const runner = execa("yarn", [], options);
                        runner.stdout.pipe(logStream);
                        runner.stderr.pipe(logStream);
                        await runner;
                    } else {
                        await execa("yarn", [], options);
                    }
                } catch (err) {
                    throw new Error("Unable to install the necessary packages: " + err.message);
                }
            }
        },
        {
            title: "Run template-specific actions",
            task: async context => {
                await require(context.templatePath)({ appName, root });
            }
        }
    ]);

    let logPath = "cwp-logs.txt";
    if (log.length > 0) {
        logPath = log;
    }
    const context = { logPath };
    await tasks.run(context).catch(async err => {
        await sendEvent({
            event: "create-webiny-project-error",
            data: {
                errorMessage: err.message,
                errorStack: err.stack
            }
        });

        console.log(
            [
                "",
                "ERROR OUTPUT:",
                "----------------------------------------",
                err.message,
                "----------------------------------------",
                "",
                "Please open an issue including the error output at https://github.com/webiny/webiny-js/issues/new.",
                "You can also get in touch with us on our Slack Community: https://www.webiny.com/slack",
                ""
            ]
                .map(line => indentString(line, 2))
                .join("\n")
        );

        console.log(`\nWriting log to ${blue(path.resolve(logPath))}...`);
        fs.writeFileSync(path.resolve(logPath), err.toString());
        console.log("Cleaning up project...");
        rimraf.sync(root);
        console.log("Project cleaned!");
        process.exit(1);
    });

    await sendEvent({ event: "create-webiny-project-end" });

    console.log(
        [
            "",
            `Your new Webiny project ${blue(appName)} is ready!`,
            `Finish the configuration by following these steps:`,
            "",
            `1.  ${blue("cd")} ${appName}`,
            `2.  Update the ${blue("MONGODB_SERVER")} variable in the ${blue(
                `${appName}/.env.json`
            )} file with your database connection string.`,
            `3.  ${blue("yarn webiny deploy")} api --env=local`,
            `4.  ${blue("cd")} apps/admin`,
            `5.  ${blue("yarn start")}`,
            "",
            `To see all the available CLI commands run ${blue("webiny --help")} in your ${blue(
                appName
            )} directory.`,
            "",
            "For more information on setting up your database connection:\nhttps://docs.webiny.com/docs/get-started/quick-start#3-setup-database-connection",
            "",
            "Want to delve deeper into Webiny? Check out https://docs.webiny.com/docs/webiny/introduction",
            "Like the project? Star us on Github! https://github.com/webiny/webiny-js",
            "",
            "Need help? Join our Slack community! https://www.webiny.com/slack",
            "",
            "🚀 Happy coding!"
        ].join("\n")
    );
}
