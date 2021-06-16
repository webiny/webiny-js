import fs from "fs";
import path from "path";
import util from "util";
import ncpBase from "ncp";
import pluralize from "pluralize";
import Case from "case";
import { replaceInPath } from "replace-in-path";
import loadJsonFile from "load-json-file";
import writeJsonFile from "write-json-file";
import chalk from "chalk";
import { CliCommandScaffoldTemplate } from "@webiny/cli-plugin-scaffold/types";
import findUp from "find-up";
import execa from "execa";
import {
    createScaffoldsIndexFile,
    updateScaffoldsIndexFile,
    formatCode
} from "@webiny/cli-plugin-scaffold/utils";

const ncp = util.promisify(ncpBase.ncp);

interface Input {
    pluginsFolderPath: string;
    dataModelName: string;
    showConfirmation?: boolean;
}

export default (): CliCommandScaffoldTemplate<Input> => ({
    name: "cli-plugin-scaffold-graphql",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "Extend GraphQL API",
        description: "Extends your GraphQL API with base CRUD queries and mutations.",
        questions: ({ context }) => {
            return [
                {
                    name: "pluginsFolderPath",
                    message: "Enter plugins folder path:",
                    default: `api/code/graphql/src/plugins`,
                    validate: pluginsFolderPath => {
                        if (pluginsFolderPath.length < 2) {
                            return `Please enter GraphQL API ${chalk.cyan("plugins")} folder path.`;
                        }

                        return true;
                    }
                },
                {
                    name: "dataModelName",
                    message: "Enter initial data model name:",
                    default: "Book",
                    validate: (dataModelName, answers) => {
                        if (!dataModelName.match(/^([a-zA-Z]+)$/)) {
                            return "A valid targetDataModel name must consist of letters only.";
                        }

                        const pluralizedCamelCasedDataModelName = pluralize(
                            Case.camel(dataModelName)
                        );

                        const newCodePath = path.resolve(
                            path.join(
                                answers.pluginsFolderPath,
                                "scaffolds",
                                "graphql",
                                pluralizedCamelCasedDataModelName
                            )
                        );

                        if (fs.existsSync(newCodePath)) {
                            const relativePath = path.relative(context.project.root, newCodePath);
                            return `Cannot continue - the ${chalk.red(
                                relativePath
                            )} folder already exists.`;
                        }

                        return true;
                    }
                }
            ];
        },
        generate: async ({ input, ora, inquirer, wait, context }) => {
            const dataModelName = {
                plural: pluralize(Case.camel(input.dataModelName)),
                singular: pluralize.singular(Case.camel(input.dataModelName))
            };

            const scaffoldsPath = path.join(input.pluginsFolderPath, "scaffolds");
            const scaffoldsIndexPath = path.join(scaffoldsPath, "index.ts");
            const newCodePath = path.join(
                scaffoldsPath,
                "graphql",
                Case.camel(dataModelName.plural)
            );
            const packageJsonPath = path.relative(
                context.project.root,
                findUp.sync("package.json", { cwd: input.pluginsFolderPath })
            );
            const templateFolderPath = path.join(__dirname, "template");

            // Get needed dependencies updates.
            const dependenciesUpdates = [];
            const packageJson = await loadJsonFile<Record<string, any>>(packageJsonPath);
            if (!packageJson?.devDependencies?.["graphql-request"]) {
                dependenciesUpdates.push(["devDependencies", "graphql-request", "^3.4.0"]);
            }

            if (input.showConfirmation !== false) {
                console.log();
                console.log(
                    `${chalk.bold("The following operations will be performed on your behalf:")}`
                );

                console.log(`- new plugins will be created in ${chalk.green(newCodePath)}`);
                console.log(
                    `- created plugins will be imported in ${chalk.green(scaffoldsIndexPath)}`
                );

                if (dependenciesUpdates.length) {
                    console.log(
                        `- dependencies in ${chalk.green(packageJsonPath)} will be updated `
                    );
                }

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
                console.log();
            }

            ora.start(`Creating new plugins in ${chalk.green(newCodePath)}...`);
            await wait(1000);

            fs.mkdirSync(newCodePath, { recursive: true });
            await ncp(templateFolderPath, newCodePath);

            // Replace generic "TargetDataModel" with received "dataModelName" argument.
            const codeReplacements = [
                { find: "targetDataModels", replaceWith: Case.camel(dataModelName.plural) },
                { find: "targetDataModel", replaceWith: Case.camel(dataModelName.singular) },
                { find: "TargetDataModel", replaceWith: Case.pascal(dataModelName.singular) },
                {
                    find: "targetDataModelDataModels",
                    replaceWith: Case.camel(dataModelName.plural)
                },
                { find: "TargetDataModels", replaceWith: Case.pascal(dataModelName.plural) },
                { find: "TARGET_DATA_MODELS", replaceWith: Case.constant(dataModelName.plural) },
                { find: "TARGET_DATA_MODEL", replaceWith: Case.constant(dataModelName.singular) }
            ];

            replaceInPath(path.join(newCodePath, "/**/*.ts"), codeReplacements);

            const fileNameReplacements = [
                {
                    find: "__tests__/graphql/targetDataModels.ts",
                    replaceWith: `__tests__/graphql/${dataModelName.plural}.ts`
                },
                {
                    find: "/entities/TargetDataModels.ts",
                    replaceWith: `/entities/${Case.pascal(dataModelName.plural)}.ts`
                },
                {
                    find: "/resolvers/TargetDataModelsMutation.ts",
                    replaceWith: `/resolvers/${Case.pascal(dataModelName.plural)}Mutation.ts`
                },
                {
                    find: "/resolvers/TargetDataModelsQuery.ts",
                    replaceWith: `/resolvers/${Case.pascal(dataModelName.plural)}Query.ts`
                },
                {
                    find: "/resolvers/TargetDataModelsResolver.ts",
                    replaceWith: `/resolvers/${Case.pascal(dataModelName.plural)}Resolver.ts`
                }
            ];

            for (const fileNameReplacement of fileNameReplacements) {
                fs.renameSync(
                    path.join(newCodePath, fileNameReplacement.find),
                    path.join(newCodePath, fileNameReplacement.replaceWith)
                );
            }

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `New plugins created in ${chalk.green(newCodePath)}.`
            });

            ora.start(`Importing created plugins in ${chalk.green(scaffoldsIndexPath)}.`);
            await wait(1000);

            createScaffoldsIndexFile(scaffoldsPath);
            await updateScaffoldsIndexFile({
                scaffoldsIndexPath,
                importName: dataModelName.plural,
                importPath: `./graphql/${dataModelName.plural}`
            });

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Imported created plugins in ${chalk.green(scaffoldsIndexPath)}.`
            });

            if (dependenciesUpdates.length) {
                ora.start(`Updating dependencies...`);
                dependenciesUpdates.forEach(([type, name, version]) => {
                    if (!packageJson[type]) {
                        packageJson[type] = {};
                    }

                    packageJson[type][name] = version;
                });

                await writeJsonFile(packageJsonPath, packageJson);
                await execa("yarn", [], { cwd: path.dirname(packageJsonPath) });
                ora.stopAndPersist({
                    symbol: chalk.green("✔"),
                    text: `Dependencies updated.`
                });
            }

            await formatCode("**/*.ts", { cwd: newCodePath });
            await formatCode("package.json", { cwd: path.dirname(packageJsonPath) });
        },
        onSuccess: async () => {
            console.log();
            console.log(
                `${chalk.green("✔")} New GraphQL API plugins created and imported successfully.`
            );
            console.log();
            console.log(chalk.bold("Next steps:"));

            console.log(
                `- deploy the extended GraphQL API and continue developing by running the ${chalk.green(
                    "yarn webiny watch api --env {dev}"
                )} command`
            );

            console.log(
                "- learn more about the created plugins and the scaffold itself at https://www.webiny.com/docs/key-topics/todo"
            );
            console.log(
                `- learn more about the ${chalk.green(
                    "webiny watch"
                )} command at https://www.webiny.com/docs/key-topics/todo`
            );
        }
    }
});
