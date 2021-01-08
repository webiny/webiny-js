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
                    templateName =
                        "file:" + path.relative(projectName, template.replace("file:", ""));
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
            title: "Setup template",
            task: async context => {
                await require(context.templatePath)({ projectName, root });
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
