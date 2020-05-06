"use strict";

process.on("unhandledRejection", err => {
    throw err;
});

const chalk = require("chalk");
const execa = require("execa");
const fg = require("fast-glob");
const fs = require("fs-extra");
const Listr = require("listr");
const loadJsonFile = require("load-json-file");
const os = require("os");
const path = require("path");
const uniqueId = require("uniqid");
const { trackActivity } = require("@webiny/tracking");
const writeJsonFile = require("write-json-file");

const packageJson = require("./package.json");
const { getPackageVersion } = require("./utils");

module.exports = async function({ root, appName, templateName, tag, log }) {
    const appPackage = require(path.join(root, "package.json"));

    if (!templateName) {
        console.log("Please provide a template.");
        return;
    }

    const activityId = uniqueId();
    await trackActivity({
        activityId,
        type: "create-webiny-project-start",
        cliVersion: packageJson.version
    });

    if (templateName.startsWith("file:")) {
        templateName = templateName.replace("file:", "");
    }

    const templatePath = path.dirname(
        require.resolve(path.join(templateName, "package.json"), { paths: [root] })
    );

    // Copy the files for the user
    const tasks = new Listr([
        {
            title: "Create project folders",
            task: () => {
                const templateDir = path.join(templatePath, "template");
                if (fs.existsSync(templateDir)) {
                    fs.copySync(templateDir, root);
                } else {
                    throw new Error(
                        `Could not locate supplied template: ${chalk.green(templateDir)}`
                    );
                }
            }
        },
        {
            title: "Set up project dependencies",
            task: () => {
                const projectDeps = require(path.join(root, "dependencies.json"));

                Object.assign(appPackage.dependencies, projectDeps.dependencies);
                if (appPackage.workspaces) {
                    Object.assign(appPackage.workspaces, projectDeps.workspaces);
                } else {
                    appPackage.workspaces = Object.assign({}, projectDeps.workspaces);
                }
                fs.writeFileSync(
                    path.join(root, "package.json"),
                    JSON.stringify(appPackage, null, 2) + os.EOL
                );
                execa.sync("rm", [path.join(root, "dependencies.json")]);
            }
        },
        {
            title: `Initialize git in ${appName}`,
            task: task => {
                try {
                    execa.sync("git", ["--version"]);
                    execa.sync("git", ["init"]);
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
                    ignore: ["**/dist/**", "**/node_modules/**"],
                    cwd: root
                });

                await Promise.all(
                    workspaces.map(async jsonPath => {
                        jsonPath = path.join(root, jsonPath);
                        const json = await loadJsonFile(jsonPath);
                        const keys = Object.keys(json.dependencies).filter(k =>
                            k.startsWith("@webiny")
                        );
                        await Promise.all(
                            keys.map(async name => {
                                if (tag.startsWith(".")) {
                                    // This means `tag` points to the location of all @webiny packages
                                    json.dependencies[name] =
                                        "link:" +
                                        path.relative(
                                            path.dirname(jsonPath),
                                            path.join(process.cwd(), tag, name)
                                        );
                                } else {
                                    // Pull tag version from npm
                                    json.dependencies[name] =
                                        `^` + (await getPackageVersion(name, tag));
                                }
                            })
                        );
                        await writeJsonFile(jsonPath, json);
                    })
                );
            }
        },
        {
            title: "Resolve packages",
            task: async () => {
                // Add package resolutions if `tag` is pointing to a local folder.

                // Why? This is very useful when you're testing packages that are not yet published to `npm`.
                // Just run `create-webiny-project my-project --tag=./local/webiny/project/node_modules` and the whole project
                // will be set up to use your local packages via symlinks, so you can develop and test immediately.
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
            }
        },
        {
            title: "Install dependencies",
            task: async () => {
                try {
                    const options = {
                        cwd: root,
                        maxBuffer: "500_000_000"
                    };

                    let logStream;
                    if (log) {
                        logStream = fs.createWriteStream(path.join(root, "logs.txt"), {
                            flags: "a"
                        });
                        const runner = execa("yarn", [], options);
                        runner.stdout.pipe(logStream);
                        runner.stderr.pipe(logStream);
                        await runner;
                    } else {
                        await execa("yarn", [], options);
                    }
                } catch (err) {
                    throw new Error("Unable to install the necessary packages.", err);
                }
            }
        },
        {
            title: "Run template-specific actions",
            task: async () => {
                // Remove template from dependencies
                if (!templateName.startsWith(".") && !templateName.startsWith("file:")) {
                    try {
                        execa.sync("rm", ["-r", "node_modules/" + templateName], {
                            cwd: root
                        });
                    } catch (err) {
                        console.log(err);
                        console.error("Unable to remove " + templateName);
                    }
                }

                //run the setup for cwp-template-full
                try {
                    const cwpTemplate = require(path.join(templatePath, "./index"));
                    await cwpTemplate({ appName, root });
                } catch (err) {
                    console.log(err);
                    console.log("Unable to perform template-specific actions.");
                }

                await trackActivity({
                    activityId,
                    type: "create-webiny-project-end",
                    cliVersion: packageJson.version
                });
            }
        }
    ]);

    try {
        await tasks.run();
    } catch (err) {
        console.error(err);
    }

    console.log(`Success!\nCreated a Webiny project ${chalk.blue(appName)} at ${root}\n`);
    console.log(`Setup your project by following these steps:\n`);
    console.log(`1.  ${chalk.blue("cd")} ${appName}\n`);
    console.log(
        `2.  Update the ${chalk.blue("MONGODB_SERVER")} variable in the ${chalk.blue(
            `${appName}/.env.json`
        )} file with your database connection string.\n`
    );
    console.log(
        "For more information on setting up your database connection head to https://docs.webiny.com/docs/get-started/quick-start#3-setup-database-connection\n"
    );
    console.log(`3.  ${chalk.blue("webiny deploy")} api --env=local\n`);
    console.log(`4.  ${chalk.blue("cd")} apps/admin\n`);
    console.log(`5.  ${chalk.blue("yarn start")}\n`);

    console.log(
        `Once you are in the ${chalk.blue(appName)} directory, run ${chalk.blue(
            "webiny --help"
        )} for more Webiny options.\n`
    );
    console.log(
        "Want to delve deeper into Webiny? Check out https://docs.webiny.com/docs/webiny/introduction\n"
    );
    console.log("Like the tool? Star us on Github! https://github.com/webiny/webiny-js\n");
    console.log("Happy coding!");
};
