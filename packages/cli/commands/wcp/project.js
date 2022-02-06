const { getUser, getProjectEnvironmentBySlug } = require("./api");
const { WCP_APP_URL } = require("./api");
const open = require("open");
const inquirer = require("inquirer");
const path = require("path");
const tsMorph = require("ts-morph");

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

                            // Assign the necessary IDs into root `webiny.project.ts` project file.
                            const webinyProjectPath = path.join(
                                context.project.root,
                                "webiny.project.ts"
                            );

                            const tsMorphProject = new tsMorph.Project();
                            tsMorphProject.addSourceFileAtPath(webinyProjectPath);

                            const source = tsMorphProject.getSourceFile(webinyProjectPath);

                            const defaultExport = source.getFirstDescendant(node => {
                                if (tsMorph.Node.isExportAssignment(node) === false) {
                                    return false;
                                }
                                return node.getText().startsWith("export default ");
                            });

                            if (!defaultExport) {
                                throw new Error(
                                    `Could not find the default export in ${context.error.hl(
                                        "webiny.project.ts"
                                    )}.`
                                );
                            }

                            // Get ObjectLiteralExpression within the default export and assign the `id` property to it.
                            const exportedObjectLiteral = defaultExport.getFirstDescendant(
                                node => tsMorph.Node.isObjectLiteralExpression(node) === true
                            );

                            const existingIdProperty = exportedObjectLiteral.getProperty(node => {
                                return (
                                    tsMorph.Node.isPropertyAssignment(node) &&
                                    node.getName() === "id"
                                );
                            });

                            if (tsMorph.Node.isPropertyAssignment(existingIdProperty)) {
                                existingIdProperty.setInitializer(`"${selectedProject.id}"`);
                            } else {
                                exportedObjectLiteral.insertProperty(
                                    0,
                                    `id: "${selectedOrg.id}/${selectedProject.id}"`
                                );
                            }

                            await tsMorphProject.save();
                        }
                    );
                }
            );
        }
    },
    {
        type: "cli-plugi"
    }
];
