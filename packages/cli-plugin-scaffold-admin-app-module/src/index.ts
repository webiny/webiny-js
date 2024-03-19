import { CliCommandScaffoldTemplate, PackageJson } from "@webiny/cli-plugin-scaffold/types";
import fs from "fs";
import path from "path";
import util from "util";
import ncpBase from "ncp";
import pluralize from "pluralize";
import Case from "case";
import loadJsonFile from "load-json-file";
import { replaceInPath } from "replace-in-path";
import chalk from "chalk";
import findUp from "find-up";
import link from "terminal-link";
import {
    createScaffoldsIndexFile,
    updateScaffoldsIndexFile,
    formatCode
} from "@webiny/cli-plugin-scaffold/utils";
import { projectHasCodeFolders } from "./utils";
const ncp = util.promisify(ncpBase.ncp);

interface Input {
    dataModelName: string;
    graphqlPluginsFolderPath: string;
    adminPluginsFolderPath: string;
    showConfirmation?: boolean;
}

const SCAFFOLD_DOCS_LINK =
    "https://www.webiny.com/docs/how-to-guides/scaffolding/extend-admin-area";

export default (): CliCommandScaffoldTemplate<Input> => ({
    name: "cli-plugin-scaffold-template-graphql-app",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "Extend Admin Area",
        description:
            "Creates a new Admin Area module and extends your GraphQL API with\n  supporting CRUD query and mutation operations." +
            (link.isSupported ? " " + link("Learn more.", SCAFFOLD_DOCS_LINK) : ""),
        questions: ({ context }) => {
            const projectWithCodeFolders = projectHasCodeFolders(context.project.root);
            let gqlSuffixPath = "/graphql/src/plugins";
            if (projectWithCodeFolders) {
                gqlSuffixPath = "/code" + gqlSuffixPath;
            }

            let adminPath = `apps/admin/src/plugins`;
            if (projectWithCodeFolders) {
                adminPath = `apps/admin/code/src/plugins`;
            }

            return [
                {
                    name: "graphqlPluginsFolderPath",
                    message: "Enter GraphQL API plugins folder path:",
                    default: `apps/api${gqlSuffixPath}`,
                    validate: (location: string) => {
                        if (location.length < 2) {
                            return `Please enter GraphQL API ${chalk.cyan("plugins")} folder path.`;
                        }

                        return true;
                    }
                },
                {
                    name: "adminPluginsFolderPath",
                    message: "Enter Admin Area plugins folder path:",
                    default: adminPath,
                    validate: (location: string) => {
                        if (location.length < 2) {
                            return `Please enter Admin Area ${chalk.cyan("plugins")} folder path.`;
                        }

                        return true;
                    }
                },
                {
                    name: "dataModelName",
                    message: "Enter initial entity name:",
                    default: "Todo",
                    validate: (dataModelName: string, answers: Input) => {
                        if (!dataModelName.match(/^([a-zA-Z]+)$/)) {
                            return "A valid name must consist of letters only.";
                        }

                        const pluralizedCamelCasedDataModelName = pluralize(
                            Case.camel(dataModelName)
                        );

                        const graphqlPluginsFolderPath = path.resolve(
                            path.join(
                                answers.graphqlPluginsFolderPath,
                                "scaffolds",
                                pluralizedCamelCasedDataModelName
                            )
                        );

                        if (fs.existsSync(graphqlPluginsFolderPath)) {
                            const relativePath = path.relative(
                                context.project.root,
                                graphqlPluginsFolderPath
                            );
                            return `Cannot continue - the ${chalk.red(
                                relativePath
                            )} folder already exists.`;
                        }

                        const adminPluginsFolderPath = path.resolve(
                            path.join(
                                answers.adminPluginsFolderPath,
                                "scaffolds",
                                pluralizedCamelCasedDataModelName
                            )
                        );

                        if (fs.existsSync(adminPluginsFolderPath)) {
                            const relativePath = path.relative(
                                context.project.root,
                                adminPluginsFolderPath
                            );
                            return `Cannot continue - the ${chalk.red(
                                relativePath
                            )} folder already exists.`;
                        }

                        return true;
                    }
                }
            ];
        },
        generate: async options => {
            const { input, context, inquirer, wait, ora } = options;

            const dataModelName = {
                plural: pluralize(Case.camel(input.dataModelName)),
                singular: pluralize.singular(Case.camel(input.dataModelName))
            };

            // Admin Area paths.
            const adminScaffoldsPath = path.join(input.adminPluginsFolderPath, "scaffolds");
            const adminScaffoldsIndexPath = path.join(adminScaffoldsPath, "index.ts");
            const adminNewCodePath = path.join(
                adminScaffoldsPath,
                Case.camel(dataModelName.plural)
            );
            const adminPackageJsonPath = path.relative(
                context.project.root,
                findUp.sync("package.json", { cwd: input.graphqlPluginsFolderPath }) as string
            );

            const adminDependenciesUpdates = [];

            // GraphQL API paths.
            const graphqlScaffoldsPath = path.join(input.graphqlPluginsFolderPath, "scaffolds");
            const graphqlScaffoldsIndexPath = path.join(graphqlScaffoldsPath, "index.ts");
            const graphqlNewCodePath = path.join(
                graphqlScaffoldsPath,
                Case.camel(dataModelName.plural)
            );
            const graphqlPackageJsonPath = path.relative(
                context.project.root,
                findUp.sync("package.json", { cwd: input.graphqlPluginsFolderPath }) as string
            );

            // Get needed dependencies updates.
            const graphqlDependenciesUpdates = [];
            const packageJson = await loadJsonFile<PackageJson>(graphqlPackageJsonPath);
            if (!packageJson?.devDependencies?.["graphql-request"]) {
                graphqlDependenciesUpdates.push(["devDependencies", "graphql-request", "^3.4.0"]);
            }

            const templateFolderPath = path.join(__dirname, "template");

            if (input.showConfirmation !== false) {
                console.log();
                console.log(
                    `${chalk.bold("The following operations will be performed on your behalf:")}`
                );

                console.log("- GraphQL API");
                console.log(
                    `  - new plugins will be created in ${chalk.green(graphqlNewCodePath)}`
                );
                console.log(
                    `  - created plugins will be imported in ${chalk.green(
                        graphqlScaffoldsIndexPath
                    )}`
                );

                if (graphqlDependenciesUpdates.length) {
                    console.log(
                        `  - dependencies in ${chalk.green(
                            graphqlPackageJsonPath
                        )} will be updated `
                    );
                }

                console.log("- Admin Area");
                console.log(`  - new plugins will be created in ${chalk.green(adminNewCodePath)}`);
                console.log(
                    `  - created plugins will be imported in ${chalk.green(
                        adminScaffoldsIndexPath
                    )}`
                );

                if (adminDependenciesUpdates.length) {
                    console.log(
                        `  - dependencies in ${chalk.green(adminPackageJsonPath)} will be updated `
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

            const cliPluginScaffoldGraphQl = context.plugins.byName<CliCommandScaffoldTemplate>(
                "cli-plugin-scaffold-graphql"
            );

            await cliPluginScaffoldGraphQl.scaffold.generate({
                ...options,
                input: {
                    showConfirmation: false,
                    dataModelName: input.dataModelName,
                    pluginsFolderPath: input.graphqlPluginsFolderPath
                }
            });

            ora.start(`Creating new plugins in ${chalk.green(adminNewCodePath)}...`);
            await wait(1000);

            fs.mkdirSync(adminNewCodePath, { recursive: true });

            await ncp(templateFolderPath, adminNewCodePath);

            // Replace generic "Target" with received "dataModelName" argument.
            const codeReplacements = [
                { find: "targetDataModels", replaceWith: Case.camel(dataModelName.plural) },
                { find: "TargetDataModels", replaceWith: Case.pascal(dataModelName.plural) },
                { find: "TARGET_DATA_MODELS", replaceWith: Case.constant(dataModelName.plural) },
                { find: "target-data-models", replaceWith: Case.kebab(dataModelName.plural) },
                { find: "Target Data Models", replaceWith: Case.title(dataModelName.plural) },

                { find: "targetDataModel", replaceWith: Case.camel(dataModelName.singular) },
                { find: "TargetDataModel", replaceWith: Case.pascal(dataModelName.singular) },
                { find: "TARGET_DATA_MODEL", replaceWith: Case.constant(dataModelName.singular) },
                { find: "target-data-model", replaceWith: Case.kebab(dataModelName.singular) },
                { find: "Target Data Model", replaceWith: Case.title(dataModelName.singular) }
            ];

            replaceInPath(path.join(adminNewCodePath, "/**/*.ts"), codeReplacements);
            replaceInPath(path.join(adminNewCodePath, "/**/*.tsx"), codeReplacements);

            const fileNameReplacements = [
                {
                    find: "views/TargetDataModelsDataList.tsx",
                    replaceWith: `views/${Case.pascal(dataModelName.plural)}DataList.tsx`
                },
                {
                    find: "views/TargetDataModelsForm.tsx",
                    replaceWith: `views/${Case.pascal(dataModelName.plural)}Form.tsx`
                },

                {
                    find: "views/hooks/useTargetDataModelsForm.ts",
                    replaceWith: `views/hooks/use${Case.pascal(dataModelName.plural)}Form.ts`
                },
                {
                    find: "views/hooks/useTargetDataModelsDataList.ts",
                    replaceWith: `views/hooks/use${Case.pascal(dataModelName.plural)}DataList.ts`
                }
            ];

            for (const fileNameReplacement of fileNameReplacements) {
                fs.renameSync(
                    path.join(adminNewCodePath, fileNameReplacement.find),
                    path.join(adminNewCodePath, fileNameReplacement.replaceWith)
                );
            }

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `New plugins created in ${chalk.green(adminNewCodePath)}.`
            });

            ora.start(`Importing created plugins in ${chalk.green(adminScaffoldsIndexPath)}.`);
            await wait(1000);

            createScaffoldsIndexFile(adminScaffoldsPath);
            await updateScaffoldsIndexFile({
                scaffoldsIndexPath: adminScaffoldsIndexPath,
                importName: dataModelName.plural,
                importPath: `./${dataModelName.plural}`
            });

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Imported created plugins in ${chalk.green(adminScaffoldsIndexPath)}.`
            });

            await formatCode(["**/*.ts", "**/*.tsx"], { cwd: adminNewCodePath });
        },
        onSuccess: async ({ context }) => {
            console.log();
            console.log(
                `${chalk.green(
                    "✔"
                )} New GraphQL API and Admin Area plugins created and imported successfully.`
            );
            console.log();
            console.log(chalk.bold("Next Steps"));

            const projectWithCodeFolders = projectHasCodeFolders(context.project.root);
            let suffixPath = "/graphql";
            if (projectWithCodeFolders) {
                suffixPath = "/code" + suffixPath;
            }

            console.log(
                `‣ deploy the extended GraphQL API and continue developing by running the ${chalk.green(
                    `yarn webiny watch apps/api${suffixPath} --env dev`
                )} command`
            );

            console.log(
                `‣ after you've deployed the extended GraphQL API, continue developing your Admin Area React application locally by running the ${chalk.green(
                    "yarn webiny watch apps/admin --env dev"
                )} command`
            );

            console.log();
            console.log(chalk.bold("Useful Links"));

            const links = [
                ["Extend Admin Area", SCAFFOLD_DOCS_LINK],
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
