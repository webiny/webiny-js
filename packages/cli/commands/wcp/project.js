import { getUser } from "./api";
import { WCP_APP_URL } from "./api";
import open from "open";
import inquirer from "inquirer";

export default () => ({
    type: "cli-command",
    name: "cli-command-wcp-project",
    create({ yargs, context }) {
        yargs.command(["project <command>"], `Webiny project-related commands`, projectCommand => {
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
                        // Load project
                        // Not loaded?
                        return;
                    }

                    console.log(user);
                    // Get user's organizations.
                    if (!user.orgs.length) {
                        context.info(
                            "It seems you're not part of any organization. Please log in into Webiny Control Panel and create one."
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

                    // Get user's projects.
                    if (!user.projects.length) {
                        context.info(
                            "It seems you're not part of any project. Please log in into Webiny Control Panel and create one."
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

                    const prompt = inquirer.createPromptModule();
                    const { proceed } = await prompt({
                        name: "org",
                        message: "Please chose an existing project.",
                        type: "confirm",
                        default: false
                    });

                    if (!proceed) {
                        process.exit(0);
                    }
                    // If there are projects, list them out and let the user choose.
                }
            );
        });
    }
});
