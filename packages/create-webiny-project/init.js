"use strict";

process.on("unhandledRejection", err => {
    throw err;
});

const chalk = require("chalk");
const crypto = require("crypto");
const execa = require("execa");
const fg = require("fast-glob");
const fs = require("fs-extra");
const loadJsonFile = require("load-json-file");
const ora = require("ora");
const os = require("os");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const writeJsonFile = require("write-json-file");

const { getPackageVersion } = require("./utils");

module.exports = async function({ root, appName, templateName, tag }) {
    const appPackage = require(path.join(root, "package.json"));

    if (!templateName) {
        console.log("Please provide a template.");
        return;
    }

    const templatePath = path.dirname(
        require.resolve(`${templateName}/package.json`, { paths: [root] })
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
    if (appPackage.workspaces) Object.assign(appPackage.workspaces, projectDeps.workspaces);
    else appPackage.workspaces = Object.assign({}, projectDeps.workspaces);

    fs.writeFileSync(path.join(root, "package.json"), JSON.stringify(appPackage, null, 2) + os.EOL);

    const filesToCopy = require("./files-to-copy");
    for (let i = 0; i < filesToCopy.length; i++) {
        if (!fs.existsSync(path.join(root, filesToCopy[i].dir, filesToCopy[i].newFile))) {
            fs.moveSync(
                path.join(root, filesToCopy[i].dir, filesToCopy[i].oldFile),
                path.join(root, filesToCopy[i].dir, filesToCopy[i].newFile),
                []
            );
        }
    }

    //Update api/.env.json
    let apiEnv = fs.readFileSync(path.join(root, "api", ".env.json"), "utf-8");
    const projectId = uuidv4()
        .split("-")
        .shift();
    const jwtSecret = crypto
        .randomBytes(128)
        .toString("base64")
        .slice(0, 60);

    apiEnv = apiEnv.replace("[JWT_SECRET]", jwtSecret);
    apiEnv = apiEnv.replace("[BUCKET]", `${projectId}-${appName}-files`);
    fs.writeFileSync(path.join(root, "api", ".env.json"), apiEnv);
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
    const spinner = ora("Loading dependencies");
    try {
        spinner.start({ color: "green" });
        await execa("yarn", [], {
            cwd: root,
            buffer: false
        });
    } catch (err) {
        console.log(err);
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

    spinner.stop();

    console.log(`Success! Created ${appName} at ${root}`);
    console.log("Inside that directory, you can run several commands:\n");
    console.log("You can begin by typing:\n");
    console.log(chalk.cyan("  cd"), appName);
    console.log("If you like the tool star us on Github! https://github.com/webiny/webiny-js\n");
    console.log(
        "Checkout our docs to learn more about Webiny as a tool https://docs.webiny.com/docs/webiny/introduction/\n"
    );
    console.log("Happy coding!");
};
