import { CliCommandScaffoldTemplate } from "@webiny/cli-plugin-scaffold/types";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import fs from "fs";
import path from "path";
import util from "util";
import ncpBase from "ncp";
import Case from "case";
import readJson from "load-json-file";
import writeJson from "write-json-file";
import { replaceInPath } from "replace-in-path";
import chalk from "chalk";
import link from "terminal-link";
import {
    formatCode,
    addWorkspaceToRootPackageJson,
    LAST_USED_GQL_API_PLUGINS_PATH
} from "@webiny/cli-plugin-scaffold/utils";
import execa from "execa";
import WebinyError from "@webiny/error";
import { TsConfigJson } from "@webiny/cli-plugin-scaffold/types";

interface Input {
    showConfirmation?: boolean;
    name: string;
    description: string;
    path: string;
}

export const deployGraphQLAPI = (stack: string, env: string, inputs: unknown) =>
    execa(
        "yarn",
        [
            "webiny",
            "deploy",
            stack,
            "--env",
            env,
            "--debug",
            /**
             * TODO @ts-refactor
             * There is no debug flag in
             * * packages/cli-plugin-scaffold-full-stack-app/src/index.ts:239
             * * packages/cli-plugin-scaffold-graphql-api/src/index.ts:345
             */
            // @ts-ignore
            Boolean(inputs.debug) ? "true" : "false"
        ],
        {
            stdio: "inherit"
        }
    );

const ncp = util.promisify(ncpBase.ncp);

const SCAFFOLD_DOCS_LINK = "https://www.webiny.com/docs/how-to-guides/scaffolding/graphql-api";

export default (): CliCommandScaffoldTemplate<Input> => ({
    name: "cli-plugin-scaffold-template-graphql-api",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "GraphQL API",
        description:
            "Creates a GraphQL API powered by AWS Lambda and Amazon DynamoDB." +
            (link.isSupported ? " " + link("Learn more.", SCAFFOLD_DOCS_LINK) : ""),
        questions: () => {
            return [
                {
                    name: "name",
                    message: "Enter GraphQL API name:",
                    default: `My New GraphQL API`,
                    validate: name => {
                        if (name.length < 2) {
                            return `Please enter a name for your new GraphQL API.`;
                        }

                        return true;
                    }
                },
                {
                    name: "description",
                    message: "Enter description:",
                    default: (input: Input) => {
                        return `This is the ${input.name} GraphQL API.`;
                    },
                    validate: description => {
                        if (description.length < 2) {
                            return `Please enter a short description for your new GraphQL API.`;
                        }

                        return true;
                    }
                },
                {
                    name: "path",
                    message: "Enter GraphQL API path:",
                    default: (input: Input) => {
                        return `${Case.kebab(input.name)}`;
                    },
                    validate: appPath => {
                        if (!appPath || appPath.length < 2) {
                            return `Please enter a valid path in which the new GraphQL API will be created.`;
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
            const { input, context, inquirer, wait, ora } = options;

            const templateFolderPath = path.join(__dirname, "template");

            if (input.showConfirmation !== false) {
                console.log();
                console.log(
                    `${chalk.bold("The following operations will be performed on your behalf:")}`
                );

                console.log(`- a new GraphQL API will be created in ${chalk.green(input.path)}`);
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
            }

            console.log();

            ora.start(`Creating a new GraphQL API in ${chalk.green(input.path)}...`);
            await wait(1000);

            fs.mkdirSync(input.path, { recursive: true });

            await ncp(templateFolderPath, input.path);

            const replacements = [
                { find: "Project application name", replaceWith: input.name },
                { find: "Project application description", replaceWith: input.description },
                { find: "projectApplicationName", replaceWith: Case.camel(input.name) },
                { find: "project-application-name", replaceWith: Case.kebab(input.name) },
                {
                    find: "project/application/path",
                    replaceWith: input.path
                },
                {
                    find: "project-application-path",
                    replaceWith: Case.kebab(input.path)
                }
            ];

            replaceInPath(path.join(input.path, "/**/*.*"), replacements);

            // Update path to the root tsconfig.json file.
            const tsConfigJsonPath = path.join(input.path, "code", "graphql", "tsconfig.json");
            const tsConfigJson = await readJson<TsConfigJson>(tsConfigJsonPath);
            tsConfigJson.extends = path.join(
                path.relative(path.join(input.path, "code", "graphql"), context.project.root),
                "tsconfig.json"
            );
            await writeJson(tsConfigJsonPath, tsConfigJson);

            // Multiple replacements follow...

            {
                // Update path to the root .babel.node file.
                const p = path.join(input.path, "code", "graphql", ".babelrc.js");
                const replacements = [
                    {
                        find: "PATH",
                        replaceWith: path
                            .relative(
                                path.join(context.project.root, input.path, "code", "graphql"),
                                context.project.root
                            )
                            .replace(/\\/g, "/")
                    }
                ];
                replaceInPath(p, replacements);
            }

            {
                // Update path to the root jest.config.base file.
                const p = path.join(input.path, "code", "graphql", "jest.config.js");
                const replacements = [
                    {
                        find: "PATH",
                        replaceWith: path
                            .relative(
                                path.join(context.project.root, input.path, "code", "graphql"),
                                context.project.root
                            )
                            .replace(/\\/g, "/")
                    }
                ];
                replaceInPath(p, replacements);
            }

            {
                // Set correct `@webiny/*` package versions in the package.json file.
                const p = path.join(input.path, "code", "graphql", "package.json");
                const replacements = [
                    {
                        find: "WEBINY_VERSION",
                        replaceWith: context.version
                    }
                ];
                replaceInPath(p, replacements);
            }

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `New GraphQL API created in ${chalk.green(input.path)}.`
            });

            ora.start(
                `Updating the list of workspaces in the root ${chalk.green("package.json")} file...`
            );
            await wait(1000);

            // Add package to workspaces.
            const rootPackageJsonPath = path.join(context.project.root, "package.json");
            const pathToAdd = `${input.path}/code/graphql`.replace(/\\/g, "/");
            await addWorkspaceToRootPackageJson(rootPackageJsonPath, pathToAdd);

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `The list of workspaces in the root ${chalk.green(
                    "package.json"
                )} file updated.`
            });

            ora.start(`Finalizing...`);

            // Once everything is done, run `yarn` so the new packages are automatically installed.
            try {
                await execa("yarn");
                await execa("yarn", ["postinstall"]);
            } catch (err) {
                throw new WebinyError(
                    `Unable to install dependencies. Try running "yarn" in project root manually.`,
                    err.message
                );
            }

            await formatCode(["**/*.ts", "**/*.tsx"], { cwd: input.path });

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Finalized.`
            });

            // Used in the Extend GraphQL API scaffold (auto filling the plugins folder path).
            context.localStorage.set(
                LAST_USED_GQL_API_PLUGINS_PATH,
                path.join(input.path, "code", "graphql", "src", "plugins")
            );

            await wait(500);
        },
        onSuccess: async options => {
            const { input, context, inquirer } = options;
            const prompt = inquirer.createPromptModule();

            console.log();
            console.log(chalk.bold("Extend GraphQL API"));
            console.log(
                `At the moment, the new GraphQL API is empty. It does not contain any GraphQL types or resolvers.`
            );

            const { extendGraphQLAPI } = await prompt({
                name: "extendGraphQLAPI",
                message: `Do you want to create initial GraphQL types and resolvers now?`,
                type: "confirm",
                default: true
            });

            if (extendGraphQLAPI) {
                const { dataModelName } = await prompt({
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
                        dataModelName,
                        pluginsFolderPath: path.join(
                            input.path,
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
                console.log(
                    `Running ${chalk.green(
                        `yarn webiny deploy ${input.path} --env dev`
                    )} command...`
                );
                console.log();
                await deployGraphQLAPI(input.path, "dev", input);
            }

            console.log(`${chalk.green("✔")} New GraphQL API created successfully.`);
            console.log();

            if (!deploy) {
                console.log(chalk.bold("Next Steps"));
                console.log(
                    `‣ deploy the new GraphQL API by running ${chalk.green(
                        `yarn webiny deploy ${input.path} --env dev`
                    )}`
                );
            } else {
                const stackOutput = getStackOutput({
                    folder: input.path,
                    env: "dev"
                });

                console.log(chalk.bold("Next Steps"));
                console.log(
                    `‣ open your GraphQL API with a GraphQL client, via the following URL:\n  ${chalk.green(
                        `[POST] ${stackOutput["apiUrl"]}/graphql`
                    )}`
                );
            }

            console.log(
                `‣ continue GraphQL API development by running ${chalk.green(
                    `yarn webiny watch ${input.path} --env dev`
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
                ["GraphQL API Scaffold", SCAFFOLD_DOCS_LINK],
                [
                    "Create Custom Application Tutorial",
                    "https://www.webiny.com/docs/tutorials/create-custom-application/introduction"
                ],
                [
                    "Extend GraphQL API Scaffold",
                    "https://www.webiny.com/docs/how-to-guides/scaffolding/extend-graphql-api"
                ],
                [
                    "Need a GraphQL Client? Check Out GraphQL Playground",
                    "https://github.com/graphql/graphql-playground"
                ],
                [
                    "Use the Watch Command",
                    "https://www.webiny.com/docs/how-to-guides/use-watch-command"
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
