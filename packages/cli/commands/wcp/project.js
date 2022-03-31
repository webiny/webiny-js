const open = require("open");
const inquirer = require("inquirer");
const { getUser, WCP_APP_URL, setProjectId, sleep } = require("./utils");

module.exports = () => [
    {
        type: "cli-command",
        name: "cli-command-wcp-project",
        create({ yargs, context }) {
            yargs.command(
                ["project <command>"],
                `Webiny project-related commands`,
                projectCommand => {
                    projectCommand.command(
                        "init",
                        `Initialize a Webiny project`,
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
                        async () => {
                            // Check login.
                            const user = await getUser();

                            // User already initialized a project?
                            const { id } = context.project.config;
                            if (id) {
                                const project = user.projects.find(item => item.id === id);
                                if (project) {
                                    context.info(
                                        `It seems this project was already initialized (project name: ${context.info.hl(
                                            project.name
                                        )}).`
                                    );

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
                                }
                            }

                            // Get user's organizations.
                            if (!user.orgs.length) {
                                context.info(
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
                                context.info("It seems you're part of multiple organizations. ");
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

                            const orgProjects = user.projects.filter(
                                item => item.org.id === selectedOrg.id
                            );

                            // Get user's projects.
                            if (!orgProjects.length) {
                                context.info(
                                    `It seems there are no projects created within the ${context.info.hl(
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
                                context.info(
                                    `It seems there are multiple projects created within the ${context.info.hl(
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

                            context.info(
                                `Initializing ${context.success.hl(
                                    selectedProject.name
                                )} project...`
                            );

                            await sleep();

                            // Assign the necessary IDs into root `webiny.project.ts` project file.
                            await setProjectId({
                                project: context.project,
                                orgId,
                                projectId
                            });

                            context.success(
                                `Project ${context.success.hl(
                                    selectedProject.name
                                )} initialized successfully.`
                            );

                            await sleep();
                            console.log();
                            context.info(
                                `If you've just created this project, you might want to deploy it via the ${context.info.hl(
                                    "yarn webiny deploy"
                                )} command.`
                            );
                        }
                    );
                }
            );
        }
    }
];
