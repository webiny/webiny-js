import { CliCommandScaffoldTemplate } from "@webiny/cli-plugin-scaffold/types";
import fs from "fs";
import path from "path";
import Case from "case";
import chalk from "chalk";
import link from "terminal-link";
import { deployGraphQLAPI } from "@webiny/cli-plugin-scaffold-graphql-api";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

interface Input {
    name: string;
    description: string;
    path: string;
}

const SCAFFOLD_DOCS_LINK =
    "https://www.webiny.com/docs/how-to-guides/webiny-cli/scaffolding/new-full-stack-application";

export default (): CliCommandScaffoldTemplate<Input> => ({
    name: "cli-plugin-scaffold-template-full-stack-app",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "Full Stack Application",
        description:
            "Creates a new React application and the supporting GraphQL API." +
            (link.isSupported ? " " + link("Learn more.", SCAFFOLD_DOCS_LINK) : ""),
        questions: () => {
            return [
                {
                    name: "name",
                    message: "Enter application name:",
                    default: `My Full Stack Application`,
                    validate: name => {
                        if (name.length < 2) {
                            return `Please enter a name for your new React application.`;
                        }

                        return true;
                    }
                },
                {
                    name: "description",
                    message: "Enter application description:",
                    default: input => {
                        return `This is the ${input.name} React application.`;
                    },
                    validate: description => {
                        if (description.length < 2) {
                            return `Please enter a short description for your new React application.`;
                        }

                        return true;
                    }
                },
                {
                    name: "path",
                    message: "Enter application path:",
                    default: input => {
                        return Case.kebab(input.name);
                    },
                    validate: appPath => {
                        if (!appPath || appPath.length < 2) {
                            return `Please enter a valid path in which the new React application will be created.`;
                        }

                        const locationPath = path.resolve(appPath);
                        if (fs.existsSync(locationPath)) {
                            return `Cannot continue - the ${chalk.red(
                                appPath
                            )} folder already exists.`;
                        }

                        return true;
                    }
                }
            ];
        },
        generate: async options => {
            const { input, context, inquirer } = options;

            const appPath = path.join(input.path, "/app");
            const apiPath = path.join(input.path, "/api");

            console.log();
            console.log(
                `${chalk.bold("The following operations will be performed on your behalf:")}`
            );

            console.log(`- a new React application will be created in ${chalk.green(appPath)}`);
            console.log(`- a new GraphQL API will be created in ${chalk.green(apiPath)}`);
            console.log(
                `- the list of workspaces will be updated in the root ${chalk.green(
                    "package.json"
                )} file`
            );

            const prompt = inquirer.createPromptModule();

            const { proceed } = await prompt({
                name: "proceed",
                message: `Are you sure you want to continue?`,
                type: "confirm",
                default: false
            });

            if (!proceed) {
                process.exit(0);
            }

            const gqlApiScaffold = context.plugins.byName<CliCommandScaffoldTemplate>(
                "cli-plugin-scaffold-template-graphql-api"
            );

            await gqlApiScaffold.scaffold.generate({
                ...options,
                input: {
                    ...input,
                    path: apiPath,
                    showConfirmation: false
                }
            });

            const reactAppScaffold = context.plugins.byName<CliCommandScaffoldTemplate>(
                "cli-plugin-scaffold-template-react-app"
            );

            await reactAppScaffold.scaffold.generate({
                ...options,
                input: {
                    ...input,
                    path: appPath,
                    showConfirmation: false
                }
            });
        },
        onSuccess: async (options) => {
            const { input, inquirer, context } = options;
            const appPath = path.join(input.path, "/app");
            const apiPath = path.join(input.path, "/api");

            console.log();
            console.log(chalk.bold("A Simple GraphQL API Example"));
            console.log(
                `By default, the new React application doesn't create an example of interacting with GraphQL API.`
            );

            const prompt = inquirer.createPromptModule();
            const { graphqlApiExample } = await prompt({
                name: "graphqlApiExample",
                message: `Would you like to create it?`,
                type: "confirm",
                default: true
            });

            if (graphqlApiExample) {
                const { dataModelName } = await prompt({
                    name: "dataModelName",
                    message: `Enter initial entity name:`,
                    default: "Book"
                });

                const cliPluginScaffoldGraphQl = context.plugins.byName<CliCommandScaffoldTemplate>(
                    "cli-plugin-scaffold-graphql"
                );

                await cliPluginScaffoldGraphQl.scaffold.generate({
                    ...options,
                    input: {
                        showConfirmation: false,
                        dataModelName,
                        pluginsFolderPath: path.join(
                            apiPath,
                            "code",
                            "graphql",
                            "src",
                            "plugins"
                        )
                    }
                });
            }

            console.log();
            console.log(chalk.bold("Initial GraphQL API Deployment"));
            console.log(`To begin developing, the new GraphQL API needs to be deployed.`);

            const { deploy } = await prompt({
                name: "deploy",
                message: `Do you want to deploy it now?`,
                type: "confirm",
                default: true
            });

            console.log();

            if (deploy) {
                console.log(`Running ${chalk.green(`yarn webiny deploy ${apiPath}`)} command...`);
                console.log();
                await deployGraphQLAPI(apiPath, "dev", input);
            }

            console.log(`${chalk.green("✔")} New full stack application created successfully.`);
            console.log();

            console.log(chalk.bold("Next Steps"));

            if (!deploy) {
                console.log(
                    `‣ deploy the new GraphQL API by running ${chalk.green(
                        `yarn webiny deploy ${apiPath} --env dev`
                    )}`
                );
            }

            console.log(
                `‣ start the application locally and continue development by running ${chalk.green(
                    `yarn webiny watch ${appPath} --env dev`
                )}`
            );

            console.log(
                `‣ continue GraphQL API development by running ${chalk.green(
                    `yarn webiny watch ${apiPath} --env dev`
                )}`
            );

            console.log(
                `‣ to speed up your GraphQL API development, use the ${chalk.green(
                    `Extend GraphQL API`
                )} scaffold`
            );

            console.log();
            console.log(chalk.bold("Useful Links"));

            const links = [
                ["Full Stack Application Scaffold", SCAFFOLD_DOCS_LINK],
                ["Create Custom Application Tutorial", SCAFFOLD_DOCS_LINK],
                [
                    "Extend GraphQL API Scaffold",
                    "https://www.webiny.com/docs/how-to-guides/webiny-cli/scaffolding/extend-graphql-api"
                ],
                [
                    "Need a GraphQL Client? Check Out GraphQL Playground",
                    "https://github.com/graphql/graphql-playground"
                ],
                [
                    "Use the Watch Command",
                    "https://www.webiny.com/docs/how-to-guides/webiny-cli/use-watch-command"
                ]
            ];

            links.forEach(([text, url]) =>
                console.log(
                    link("‣ " + text, url, { fallback: (text, link) => text + " - " + link })
                )
            );
        }
    }
});
