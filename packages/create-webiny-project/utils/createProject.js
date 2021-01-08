#!/usr/bin/env node
const { red, green } = require("chalk");
const execa = require("execa");
const fs = require("fs-extra");
const Listr = require("listr");
const os = require("os");
const path = require("path");
const indentString = require("indent-string");
const { sendEvent } = require("@webiny/tracking");
const rimraf = require("rimraf");
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
                "🚨 IMPORTANT NOTICE:",
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
            title: "Prepare project folder",
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
                let add;
                let templateName = `@webiny/cwp-template-${template}`;

                if (template.startsWith(".") || template.startsWith("file:")) {
                    templateName = "file:" + path.relative(appName, template.replace("file:", ""));
                    add = templateName;
                } else {
                    add = `${templateName}@${tag}`;
                }

                // Assign template name to context.
                context.templateName = templateName;

                await execa("yarn", ["add", "--exact", add, "--cwd", root]);
            }
        },
        {
            // Initialize `git` by executing `git init` in project directory.
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
        }
    ]);

    let logPath = "cwp-logs.txt";
    if (log.length > 0) {
        logPath = log;
    }
    const context = { logPath };
    await tasks
        .run(context)
        .then(() => {
            let templateName = context.templateName;
            if (templateName.startsWith("file:")) {
                templateName = templateName.replace("file:", "");
            }

            const templatePath = path.dirname(
                require.resolve(path.join(templateName, "package.json"), {
                    paths: [root]
                })
            );

            return new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                    // Add a new line break before receiving output from template script.
                    console.log();
                    return require(templatePath)({ projectName, root });
                }, 500);
            });
        })
        .catch(async err => {
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
            console.log("Cleaning up project...");
            rimraf.sync(root);
            console.log("Project cleaned!");
            process.exit(1);
        });

    await sendEvent({ event: "create-webiny-project-end" });
};
