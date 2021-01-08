#!/usr/bin/env node
const { red, green } = require("chalk");
const execa = require("execa");
const fs = require("fs-extra");
const Listr = require("listr");
const os = require("os");
const path = require("path");
const indentString = require("indent-string");
const fg = require("fast-glob");
const findUp = require("find-up");
const loadJsonFile = require("load-json-file");
const { sendEvent } = require("@webiny/tracking");
const writeJsonFile = require("write-json-file");
const rimraf = require("rimraf");
const getPackageVersion = require("./getPackageVersion");
const getPackageJson = require("./getPackageJson");

const checkProjectName = require("./checkProjectName");

module.exports = async function createProject({ projectName, template, tag, log }) {
    if (!projectName) {
        throw Error("You must provide a name for the project to use.");
    }

    const root = path.resolve(projectName).replace(/\\/g, "/");
    projectName = path.basename(root);

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
                `We've detected a global installation of ${green(
                    "@webiny/cli"
                )}. This might not play well with your new project.`,
                `We recommend you do one of the following things:\n`,
                ` - uninstall the global @webiny/cli package by running ${green(
                    "npm rm -g @webiny/cli"
                )} or`,
                ` - run webiny commands using ${green(
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

    console.log(`Creating project at ${green(root)}:`);

    await sendEvent({ event: "create-webiny-project-start" });

    const tasks = new Listr([
        {
            // Creates root package.json.
            title: "Pre-template setup",
            task: () => {
                checkProjectName(projectName);
                fs.ensureDirSync(projectName);

                const packageJson = getPackageJson(projectName);

                fs.writeFileSync(
                    path.join(root, "package.json"),
                    JSON.stringify(packageJson, null, 2) + os.EOL
                );
            }
        },
        {
            // "yarn adds" given template which can be either a real package or a path of a local package.
            title: `Install template package`,
            task: async context => {
                let templateName = `@webiny/cwp-template-${template}`;
                if (template.startsWith(".") || template.startsWith("file:")) {
                    templateName = "file:" + path.relative(projectName, template.replace("file:", ""));
                } else {
                    templateName = `${templateName}@${tag}`;
                }

                // Assign template name to context.
                context.templateName = templateName;

                await execa("yarn", ["add", "--exact", templateName, "--cwd", root]);
            }
        },
        {
            // Sets up path to template, which is resolved via received template name.
            title: "Create project folders",
            task: context => {
                let templateName = context.templateName;
                if (templateName.startsWith("file:")) {
                    templateName = templateName.replace("file:", "");
                }

                context.templatePath = path.dirname(
                    require.resolve(path.join(templateName, "package.json"), {
                        paths: [root]
                    })
                );
            }
        },
        /*{
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
        },*/
        /* {
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
        },*/
        /* {
            title: "Get proper package versions",
            task: async () => {
                // Set proper @webiny package versions
                const workspaces = await fg(["**!/package.json"], {
                    ignore: ["**!/dist/!**", "**!/node_modules/!**", root],
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
                            // Skip packages that are already set to use file: protocol
                            if (json.dependencies[name].startsWith("file:")) {
                                return;
                            }

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
                        const webinyPackages = await fg(["@webiny/!*"], {
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
        },*/
        /*{
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
        },*/
        {
            title: "Run template-specific actions",
            task: async context => {
                await require(context.templatePath)({ projectName, root });
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

        console.log(`\nWriting log to ${green(path.resolve(logPath))}...`);
        fs.writeFileSync(path.resolve(logPath), err.toString());
        console.log("No cleanup.");
        console.log("Cleaning up project...");
        rimraf.sync(root);
        console.log("Project cleaned!");
        process.exit(1);
    });

    await sendEvent({ event: "create-webiny-project-end" });

    console.log(
        [
            "",
            `Your new Webiny project ${green(projectName)} is ready!`,
            `Finish the setup by running the following command: ${green(
                `cd ${projectName} && yarn webiny deploy`
            )}`,
            "",
            `To see all of the available CLI commands, run ${green(
                "webiny --help"
            )} in your ${green(projectName)} directory.`,
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
};
