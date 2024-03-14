#!/usr/bin/env node
const { yellow, red, green, gray, bold } = require("chalk");
const execa = require("execa");
const fs = require("fs-extra");
const Listr = require("listr");
const path = require("path");
const writeJson = require("write-json-file");
const rimraf = require("rimraf");
const { sendEvent } = require("@webiny/telemetry/cli");
const getPackageJson = require("./getPackageJson");
const validateProjectName = require("./validateProjectName");
const yaml = require("js-yaml");
const findUp = require("find-up");
const { GracefulError } = require("./GracefulError");

const NOT_APPLICABLE = gray("N/A");
const HL = bold(gray("—")).repeat(30);

const sleep = () =>
    new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, 500);
    });

module.exports = async function createProject({
    projectName,
    force,
    template,
    tag,
    log,
    debug,
    cleanup,
    interactive,
    templateOptions,
    assignToYarnrc: assignToYarnRc
}) {
    if (!projectName) {
        throw Error("You must provide a name for the project to use.");
    }

    const projectRoot = path.resolve(projectName).replace(/\\/g, "/");
    projectName = path.basename(projectRoot);

    if (fs.existsSync(projectRoot)) {
        if (!force) {
            console.log(
                `Cannot continue because the target folder ${red(projectName)} already exists.`
            );
            console.log(
                `If you still wish to proceed, run the same command with the ${red(
                    "--force"
                )} flag.`
            );
            process.exit(1);
        }
    }

    // Before create any files, check if there are yarn.lock or package.json anywhere up in the tree.
    await Promise.all([findUp("yarn.lock"), findUp("package.json")])
        .then(files => files.filter(Boolean))
        .then(files => {
            if (files.length) {
                const messages = [
                    "\nThe following file(s) will cause problems with project root detection:\n",
                    ...files.map(file => red(file) + "\n"),
                    `\nMake sure you delete all ${red("yarn.lock")} and ${red(
                        "package.json"
                    )} files higher in the hierarchy.`
                ];

                console.log(messages.join(""));
                process.exit(1);
            }
        });

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

    validateProjectName(projectName);

    console.log(`Initializing a new Webiny project in ${green(projectRoot)}...`);

    await sendEvent({ event: "create-webiny-project-start" });

    let isGitAvailable = false;
    try {
        await execa("git", ["--version"]);
        isGitAvailable = true;
    } catch {
        // Git is not available.
    }

    const tasks = new Listr(
        [
            {
                // Creates root package.json.
                title: "Prepare project folder",
                task: () => {
                    fs.ensureDirSync(projectName);
                    writeJson.sync(
                        path.join(projectRoot, "package.json"),
                        getPackageJson(projectName)
                    );
                }
            },
            {
                // Setup yarn
                title: "Setup Yarn",
                task: async () => {
                    const yarnVersion = "3.6.4";
                    const yarnFile = `yarn-${yarnVersion}.cjs`;
                    const yarnPath = `.yarn`;
                    const yarnReleasesPath = path.join(yarnPath, "releases");
                    const yarnReleasesFilePath = path.join(yarnReleasesPath, yarnFile);

                    /**
                     * We do not want to do the recursive directory creating as it might do something in parent directories which we do not want.
                     */
                    const yarnReleaseFullPath = path.join(projectRoot, yarnReleasesPath);
                    fs.ensureDirSync(yarnReleaseFullPath);

                    const source = path.join(__dirname, path.join("binaries", yarnFile));
                    if (!fs.existsSync(source)) {
                        throw new Error(`No yarn binary source file: ${source}`);
                    }

                    const target = path.join(projectRoot, yarnReleasesFilePath);
                    fs.copyFileSync(source, target);

                    // `.yarnrc.yml` file is created here.
                    const yarnRcPath = path.join(projectRoot, ".yarnrc.yml");

                    let rawYarnRc = `yarnPath: ${yarnReleasesFilePath}`;
                    if (fs.existsSync(yarnRcPath)) {
                        rawYarnRc = fs.readFileSync(yarnRcPath, "utf-8");
                    }

                    const parsedYarnRc = yaml.load(rawYarnRc);

                    // Default settings are applied here. Currently, we only apply the `nodeLinker` param.
                    parsedYarnRc.nodeLinker = "node-modules";

                    // Enables adding additional params into the `.yarnrc.yml` file.
                    if (assignToYarnRc) {
                        let parsedAssignToYarnRc;
                        try {
                            parsedAssignToYarnRc = JSON.parse(assignToYarnRc);
                        } catch {
                            console.log(
                                yellow("Warning: could not parse provided --assign-to-yarnrc JSON.")
                            );
                        }

                        if (parsedAssignToYarnRc) {
                            Object.assign(parsedYarnRc, parsedAssignToYarnRc);
                        }
                    }

                    fs.writeFileSync(yarnRcPath, yaml.dump(parsedYarnRc));
                }
            },
            {
                // Yarn adds given template which can be either a real package or a path of a local package.
                title: `Install template package`,
                task: async context => {
                    let add;
                    let templateName = `@webiny/cwp-template-${template}`;

                    if (template.startsWith(".") || template.startsWith("file:")) {
                        templateName =
                            "file:" + path.relative(projectName, template.replace("file:", ""));
                        templateName = `@webiny/cwp-template-aws@` + templateName;
                        add = templateName;
                    } else {
                        add = `${templateName}@${tag}`;
                    }

                    // Assign template name to context.
                    context.templateName = templateName;

                    await execa("yarn", ["add", add], { cwd: projectRoot });
                }
            },
            isGitAvailable
                ? {
                      // Initialize `git` by executing `git init` in project directory.
                      title: `Initialize git`,
                      task: (ctx, task) => {
                          try {
                              execa.sync("git", ["--version"]);
                              execa.sync("git", ["init"], { cwd: projectRoot });
                              fs.writeFileSync(
                                  path.join(projectRoot, ".gitignore"),
                                  "node_modules/"
                              );
                          } catch (err) {
                              task.skip("Git repo not initialized", err);
                          }
                      }
                  }
                : null
        ].filter(Boolean)
    );

    // The `context` object will be filled with additional values in the `tasks.run` process.
    const context = {};

    try {
        await tasks.run(context);

        let templateName = context.templateName;
        if (templateName.includes("file:")) {
            const [, templatePath] = templateName.match(/.*?file\:(.*)/);
            templateName = templatePath;
        }

        const templatePath = path.dirname(
            require.resolve(path.join(templateName, "package.json"), {
                paths: [projectRoot]
            })
        );

        await sleep();

        let parsedTemplateOptions = {};
        if (templateOptions) {
            try {
                parsedTemplateOptions = JSON.parse(templateOptions);
            } catch {
                console.log(yellow("Warning: could not parse provided --template-options JSON."));
            }
        }

        console.log();

        await require(templatePath)({
            log,
            isGitAvailable,
            projectName,
            projectRoot,
            interactive,
            debug,
            templateOptions: parsedTemplateOptions
        });

        await sendEvent({ event: "create-webiny-project-end" });
    } catch (err) {
        if (err instanceof GracefulError) {
            await sendEvent({
                event: "create-webiny-project-error-graceful",
                properties: {
                    errorMessage: err.message,
                    errorStack: err.stack
                }
            });
        } else {
            await sendEvent({
                event: "create-webiny-project-error",
                properties: {
                    errorMessage: err.message,
                    errorStack: err.stack
                }
            });
        }
        const node = process.versions.node;
        const os = process.platform;

        let npm = NOT_APPLICABLE;
        try {
            const subprocess = await execa("npm", ["--version"], { cwd: projectRoot });
            npm = subprocess.stdout;
        } catch {}

        let npx = NOT_APPLICABLE;
        try {
            const subprocess = await execa("npx", ["--version"], { cwd: projectRoot });
            npx = subprocess.stdout;
        } catch {}

        let yarn = NOT_APPLICABLE;
        try {
            const subprocess = await execa("yarn", ["--version"], { cwd: projectRoot });
            yarn = subprocess.stdout;
        } catch {}

        let cwp = NOT_APPLICABLE;
        try {
            const subprocess = await execa("npx", ["create-webiny-project", "--version"]);
            cwp = subprocess.stdout;
        } catch {}

        let cwpTemplate = NOT_APPLICABLE;
        try {
            const subprocess = await execa("yarn", ["info", "@webiny/cwp-template-aws", "--json"], {
                cwd: projectRoot
            });
            const data = JSON.parse(subprocess.stdout);
            cwpTemplate = `@webiny/cwp-template-${template}@${data.children.Version}`;
        } catch {}

        let templateOptionsJson = "{}";
        if (templateOptions) {
            try {
                templateOptionsJson = JSON.stringify(templateOptions);
            } catch {}
        }

        console.log(
            [
                "",
                `${bold("Error Logs")}`,
                HL,
                err.message,
                "",
                `${bold("System Information")}`,
                HL,
                `create-webiny-project: ${cwp}`,
                `Operating System: ${os}`,
                `Node: ${node}`,
                `Yarn: ${yarn}`,
                `Npm: ${npm}`,
                `Npx: ${npx}`,
                `Template: ${cwpTemplate}`,
                `Template Options: ${templateOptionsJson}`,
                "",
                "Please open an issue including the error output at https://github.com/webiny/webiny-js/issues/new.",
                "You can also get in touch with us on our Slack Community: https://www.webiny.com/slack",
                ""
            ].join("\n")
        );

        console.log(`Writing logs to ${green(path.resolve(log))}...`);
        fs.writeFileSync(path.resolve(log), err.toString());

        console.log();
        if (cleanup) {
            console.log("Deleting created files and folders...");
            rimraf.sync(projectRoot);
        } else {
            console.log("Project cleanup skipped.");
        }

        process.exit(1);
    }
};
