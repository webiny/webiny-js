"use strict";

process.on("unhandledRejection", err => {
    throw err;
});

const chalk = require("chalk");
const execa = require("execa");
const fg = require("fast-glob");
const fs = require("fs-extra");
const loadJsonFile = require("load-json-file");
const ora = require("ora");
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
    const templateDir = path.join(templatePath, "template");
    if (fs.existsSync(templateDir)) {
        fs.copySync(templateDir, root);
    } else {
        console.error(`Could not locate supplied template: ${chalk.green(templateDir)}`);
        return;
    }

    const projectDeps = require(path.join(root, "dependencies.json"));

    Object.assign(appPackage.dependencies, projectDeps.dependencies);
    if (appPackage.workspaces) {
        Object.assign(appPackage.workspaces, projectDeps.workspaces);
    } else {
        appPackage.workspaces = Object.assign({}, projectDeps.workspaces);
    }

    fs.writeFileSync(path.join(root, "package.json"), JSON.stringify(appPackage, null, 2) + os.EOL);

    execa.sync("rm", [path.join(root, "dependencies.json")]);
    //initialize git repo
    try {
        execa.sync("git", ["--version"]);
        execa.sync("git", ["init"]);
        console.log("\nInitialized a git repository.");
        fs.writeFileSync(path.join(root, ".gitignore"), "node_modules/");
    } catch (err) {
        console.warn("Git repo not initialized", err);
    }

    // Set proper @webiny package versions
    const workspaces = await fg(["**/package.json"], {
        ignore: ["**/dist/**", "**/node_modules/**"],
        cwd: root
    });

    await Promise.all(
        workspaces.map(async jsonPath => {
            jsonPath = path.join(root, jsonPath);
            const json = await loadJsonFile(jsonPath);
            const keys = Object.keys(json.dependencies).filter(k => k.startsWith("@webiny"));
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
                        json.dependencies[name] = `^` + (await getPackageVersion(name, tag));
                    }
                })
            );
            await writeJsonFile(jsonPath, json);
        })
    );

    // Add package resolutions if `tag` is pointing to a local folder
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

            webinyPackages.forEach(name => {
                rootPkgJson.resolutions[name] =
                    "link:" + path.relative(root, path.join(process.cwd(), tag, name));
            });

            await writeJsonFile(rootPkg, rootPkgJson);
        }
    }

    // Install repo dependencies
    const spinner = ora("Installing dependencies...").start();
    try {
        const options = {
            cwd: root,
            maxBuffer: "500_000_000"
        };

        let logStream;
        if (log) {
            logStream = fs.createWriteStream(path.join(root, "logs.txt"), { flags: "a" });
            const runner = execa("yarn", [], options);
            runner.stdout.pipe(logStream);
            runner.stderr.pipe(logStream);
            await runner;
        } else {
            await execa("yarn", [], options);
        }
    } catch (err) {
        spinner.fail("Unable to install the necessary packages.", err);
        return;
    }

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

    spinner.succeed("All packages installed.");
    await trackActivity({
        activityId,
        type: "create-webiny-project-end",
        cliVersion: packageJson.version
    });

    console.log(`Success! Created ${appName} at ${root}`);
    console.log("Inside that directory, you can run several commands:\n");
    console.log("You can begin by typing:\n");
    console.log(`${chalk.cyan("  cd")} ${appName}\n`);
    console.log(
        `Make sure to update the ${chalk.cyan("MONGODB_SERVER")} variable in the ${chalk.cyan(
            `${appName}/.env.json`
        )} file with your database connection string.\n`
    );
    console.log(
        "For more information on setting up your database connection head to https://docs.webiny.com/docs/get-started/quick-start#3-setup-database-connection.\n"
    );
    console.log(
        `Once you are in the ${chalk.cyan(appName)} directory, run ${chalk.cyan(
            "webiny --help"
        )} to see deploy options.\n`
    );
    console.log(
        "If you want to learn more about Webiny as a tool, head to https://docs.webiny.com/docs/webiny/introduction/.\n"
    );
    console.log("Like the tool? Star us on Github! https://github.com/webiny/webiny-js\n");
    console.log("Happy coding!");
};
