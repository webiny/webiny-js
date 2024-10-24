const open = require("open");
const inquirer = require("inquirer");
const chalk = require("chalk");
const { getUser, WCP_APP_URL, setProjectId } = require("./utils");
const { sleep } = require("../../utils");

module.exports.command = () => [
    {
        type: "cli-command",
        name: "cli-command-wcp-project",
        create({ yargs, context }) {
            yargs.command(
                ["project <command>"],
                `Webiny project-related commands`,
                projectCommand => {
                    projectCommand.command(
                        "link",
                        `Link a Webiny project with Webiny Control Panel (WCP)`,
                        command => {
                            yargs.option("debug", {
                                describe: `Turn on debug logs`,
                                type: "boolean"
                            });
                            yargs.option("debug-level", {
                                default: 1,
                                describe: `Set the debug logs verbosity level`,
                                type: "number"
                            });
                            command.example("$0 project link");
                        },
                        () => handler({ context })
                    );

                    projectCommand.command(
                        "init",
                        `Initialize a Webiny project (deprecated, please use the link command instead)`,
                        command => {
                            yargs.option("debug", {
                                describe: `Turn on debug logs`,
                                type: "boolean"
                            });
                            yargs.option("debug-level", {
                                default: 1,
                                describe: `Set the debug logs verbosity level`,
                                type: "number"
                            });
                            command.example("$0 project init");
                        },
                        () => handler({ context })
                    );
                }
            );
        }
    }
];

const handler = async ({ context }) => {
    // Check login.
    const user = await getUser();

    // User already linked a project?
    const { id: orgProjectId } = context.project.config;
    if (orgProjectId) {
        const [, projectId] = orgProjectId.split("/");
        const project = user.projects.find(item => item.id === projectId);
        if (project) {
            console.log(`Your ${chalk.green(orgProjectId)} project has already been linked.`);

            const prompt = inquirer.createPromptModule();
            const { proceed } = await prompt({
                name: "proceed",
                message: "Would you like to re-initialize it?",
                type: "confirm",
                default: false
            });

            if (!proceed) {
                return;
            }

            console.log();
        }
    }

    // Get user's organizations.
    if (!user.orgs.length) {
        console.log(
            "It seems you're not part of any organization. Please log in to Webiny Control Panel and create one."
        );

        const prompt = inquirer.createPromptModule();
        const { proceed } = await prompt({
            name: "proceed",
            message: "Would you like to do that now?",
            type: "confirm",
            default: false
        });

        if (proceed) {
            await open(WCP_APP_URL);
        }
        return;
    }

    let selectedOrg;
    if (user.orgs.length === 1) {
        selectedOrg = user.orgs[0];
    } else {
        console.log("It seems you're part of multiple organizations. ");
        const choices = user.orgs.map(item => ({
            name: item.name,
            value: item
        }));

        const prompt = inquirer.createPromptModule();
        selectedOrg = await prompt({
            name: "org",
            message: "Select organization:",
            type: "list",
            choices,
            default: choices[0].value
        }).then(result => result.org);
    }

    const orgProjects = user.projects.filter(item => item.org.id === selectedOrg.id);

    // Get user's projects.
    if (!orgProjects.length) {
        console.log(
            `It seems there are no projects created within the ${chalk.green(
                selectedOrg.name
            )} organization.`
        );

        const prompt = inquirer.createPromptModule();
        const { proceed } = await prompt({
            name: "proceed",
            message: "Would you like to create one now?",
            type: "confirm",
            default: false
        });

        if (proceed) {
            await open(WCP_APP_URL);
        }
        return;
    }

    let selectedProject;
    if (orgProjects.length === 1) {
        selectedProject = user.projects[0];
    } else {
        console.log(
            `It seems there are multiple projects created within the ${chalk.green(
                selectedOrg.name
            )} organization.`
        );
        const choices = orgProjects.map(item => ({
            name: item.name,
            value: item
        }));
        const prompt = inquirer.createPromptModule();
        selectedProject = await prompt({
            name: "project",
            message: "Select project:",
            type: "list",
            choices,
            default: choices[0].value
        }).then(result => result.project);
    }

    const orgId = selectedOrg.id,
        projectId = selectedProject.id;

    await sleep();
    console.log();

    console.log(`Initializing ${context.success.hl(selectedProject.name)} project...`);

    await sleep();

    // Assign the necessary IDs into root `webiny.project.ts` project file.
    await setProjectId({
        project: context.project,
        orgId,
        projectId
    });

    console.log(
        `${chalk.green("✔")} Project ${context.success.hl(
            selectedProject.name
        )} linked successfully.`
    );

    await sleep();

    console.log();
    console.log(chalk.bold("Next Steps"));

    console.log(`‣ deploy your project via the ${chalk.green("yarn webiny deploy")} command`);
};

module.exports.handler = handler;
