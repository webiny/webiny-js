import { CliCommandScaffoldTemplate } from "@webiny/cli-plugin-scaffold/types";
import fs from "fs";
import path from "path";
import Case from "case";
import chalk from "chalk";
import link from "terminal-link";
import { deployGraphQLAPI } from "@webiny/cli-plugin-scaffold-graphql-api";
import pluralize from "pluralize";
import { replaceInPath } from "replace-in-path";

import util from "util";
import ncpBase from "ncp";
const ncp = util.promisify(ncpBase.ncp);

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
        name: "New Full Stack Application",
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

            console.log(`- a new GraphQL API will be created in ${chalk.green(apiPath)}`);
            console.log(`- a new React application will be created in ${chalk.green(appPath)}`);
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

            const templateFolderPath = path.join(__dirname, "templates", "essentials");
            await ncp(templateFolderPath, appPath);
        },
        onSuccess: async options => {
            const { input, inquirer, context, wait } = options;
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
                const answers = await prompt({
                    name: "dataModelName",
                    message: `Enter initial entity name:`,
                    default: "Todo"
                });

                const cliPluginScaffoldGraphQl = context.plugins.byName<CliCommandScaffoldTemplate>(
                    "cli-plugin-scaffold-graphql"
                );

                await cliPluginScaffoldGraphQl.scaffold.generate({
                    ...options,
                    input: {
                        showConfirmation: false,
                        dataModelName: answers.dataModelName,
                        pluginsFolderPath: path.join(apiPath, "code", "graphql", "src", "plugins")
                    }
                });

                const templateFolderPath = path.join(__dirname, "templates", "graphqlApiExample");
                await ncp(templateFolderPath, appPath);

                // Store used input, so that maybe some of
                const dataModelName = {
                    plural: pluralize(Case.camel(answers.dataModelName)),
                    singular: pluralize.singular(Case.camel(answers.dataModelName))
                };

                // Wait a bit, since otherwise, replaceInPath might fail. Too soon making operations?
                await wait(500);

                // Replace generic "TargetDataModel" with received "dataModelName" argument.
                const codeReplacements = [
                    { find: "targetDataModels", replaceWith: Case.camel(dataModelName.plural) },
                    { find: "TargetDataModels", replaceWith: Case.pascal(dataModelName.plural) },
                    {
                        find: "TARGET_DATA_MODELS",
                        replaceWith: Case.constant(dataModelName.plural)
                    },
                    { find: "target-data-models", replaceWith: Case.kebab(dataModelName.plural) },
                    { find: "Target Data Models", replaceWith: Case.title(dataModelName.plural) },

                    { find: "targetDataModel", replaceWith: Case.camel(dataModelName.singular) },
                    { find: "TargetDataModel", replaceWith: Case.pascal(dataModelName.singular) },
                    {
                        find: "TARGET_DATA_MODEL",
                        replaceWith: Case.constant(dataModelName.singular)
                    },
                    { find: "target-data-model", replaceWith: Case.kebab(dataModelName.singular) },
                    { find: "Target Data Model", replaceWith: Case.title(dataModelName.singular) },
                    { find: "project-applications-path", replaceWith: input.path }
                ];

                replaceInPath(path.join(appPath, "code", "**/*.ts"), codeReplacements);
                replaceInPath(path.join(appPath, "code", "**/*.tsx"), codeReplacements);
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

            if (deploy) {
                console.log();
                console.log(`Running ${chalk.green(`yarn webiny deploy ${apiPath}`)} command...`);
                console.log();
                await deployGraphQLAPI(apiPath, "dev", input);
            }

            console.log();
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
                `‣ start the React application locally and continue development by running ${chalk.green(
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
