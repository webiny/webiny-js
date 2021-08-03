import { CliCommandScaffoldTemplate } from "@webiny/cli-plugin-scaffold/types";
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

const ncp = util.promisify(ncpBase.ncp);

interface Input {
    name: string;
    description: string;
    path: string;
}

const SCAFFOLD_DOCS_LINK =
    "https://www.webiny.com/docs/how-to-guides/webiny-cli/scaffolding/new-react-application";

export default (): CliCommandScaffoldTemplate<Input> => ({
    name: "cli-plugin-scaffold-template-react-app",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "New React Application",
        description:
            "Creates a new React application, inside of a new project application." +
            (link.isSupported ? " " + link("Learn more.", SCAFFOLD_DOCS_LINK) : ""),
        questions: () => {
            return [
                {
                    name: "name",
                    message: "Enter application name:",
                    default: `My New React Application`,
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
                    default: `This is a React application created via the New React Application scaffold.`,
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
                        return `apps/${Case.kebab(input.name)}`;
                    },
                    validate: path => {
                        if (path.length < 2) {
                            return `Please enter a valid path in which the new React application will be created.`;
                        }

                        return true;
                    }
                }
            ];
        },
        generate: async options => {
            const { input, context, inquirer, wait, ora } = options;

            const templateFolderPath = path.join(__dirname, "template");

            console.log();
            console.log(
                `${chalk.bold("The following operations will be performed on your behalf:")}`
            );

            console.log("- GraphQL API");
            console.log(`- new React application created in ${chalk.green(input.path)}`);

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

            ora.start(`Creating a new React application in ${chalk.green(input.path)}...`);
            await wait(1000);

            fs.mkdirSync(input.path, { recursive: true });

            await ncp(templateFolderPath, input.path);

            const codeReplacements = [
                { find: "Project application name", replaceWith: input.name },
                { find: "Project application description", replaceWith: input.description },
                { find: "projectApplicationId", replaceWith: Case.camel(input.name) },
                { find: "project-application-id", replaceWith: Case.kebab(input.name) }
            ];

            replaceInPath(path.join(input.path, "/**/*.*"), codeReplacements);

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `New React Application created in ${chalk.green(input.path)}.`
            });

            // const dataModelName = {
            //     plural: pluralize(Case.camel(input.dataModelName)),
            //     singular: pluralize.singular(Case.camel(input.dataModelName))
            // };
            //
            // // Admin Area paths.
            // const adminScaffoldsPath = path.join(input.adminPluginsFolderPath, "scaffolds");
            // const adminScaffoldsIndexPath = path.join(adminScaffoldsPath, "index.ts");
            // const adminNewCodePath = path.join(
            //     adminScaffoldsPath,
            //     Case.camel(dataModelName.plural)
            // );
            // const adminPackageJsonPath = path.relative(
            //     context.project.root,
            //     findUp.sync("package.json", { cwd: input.graphqlPluginsFolderPath })
            // );
            //
            // const adminDependenciesUpdates = [];
            //
            // // GraphQL API paths.
            // const graphqlScaffoldsPath = path.join(input.graphqlPluginsFolderPath, "scaffolds");
            // const graphqlScaffoldsIndexPath = path.join(graphqlScaffoldsPath, "index.ts");
            // const graphqlNewCodePath = path.join(
            //     graphqlScaffoldsPath,
            //     Case.camel(dataModelName.plural)
            // );
            // const graphqlPackageJsonPath = path.relative(
            //     context.project.root,
            //     findUp.sync("package.json", { cwd: input.graphqlPluginsFolderPath })
            // );
            //
            // // Get needed dependencies updates.
            // const graphqlDependenciesUpdates = [];
            // const packageJson = await loadJsonFile<Record<string, any>>(graphqlPackageJsonPath);
            // if (!packageJson?.devDependencies?.["graphql-request"]) {
            //     graphqlDependenciesUpdates.push(["devDependencies", "graphql-request", "^3.4.0"]);
            // }
            //
            // const templateFolderPath = path.join(__dirname, "template");
            //
            // if (input.showConfirmation !== false) {
            //     console.log();
            //     console.log(
            //         `${chalk.bold("The following operations will be performed on your behalf:")}`
            //     );
            //
            //     console.log("- GraphQL API");
            //     console.log(
            //         `  - new plugins will be created in ${chalk.green(graphqlNewCodePath)}`
            //     );
            //     console.log(
            //         `  - created plugins will be imported in ${chalk.green(
            //             graphqlScaffoldsIndexPath
            //         )}`
            //     );
            //
            //     if (graphqlDependenciesUpdates.length) {
            //         console.log(
            //             `  - dependencies in ${chalk.green(
            //                 graphqlPackageJsonPath
            //             )} will be updated `
            //         );
            //     }
            //
            //     console.log("- Admin Area");
            //     console.log(`  - new plugins will be created in ${chalk.green(adminNewCodePath)}`);
            //     console.log(
            //         `  - created plugins will be imported in ${chalk.green(
            //             adminScaffoldsIndexPath
            //         )}`
            //     );
            //
            //     if (adminDependenciesUpdates.length) {
            //         console.log(
            //             `  - dependencies in ${chalk.green(adminPackageJsonPath)} will be updated `
            //         );
            //     }
            //
            //     const prompt = inquirer.createPromptModule();
            //
            //     const { proceed } = await prompt({
            //         name: "proceed",
            //         message: `Are you sure you want to continue?`,
            //         type: "confirm",
            //         default: false
            //     });
            //
            //     if (!proceed) {
            //         process.exit(0);
            //     }
            //     console.log();
            // }
            //
            // const cliPluginScaffoldGraphQl = context.plugins.byName<CliCommandScaffoldTemplate>(
            //     "cli-plugin-scaffold-graphql"
            // );
            //
            // await cliPluginScaffoldGraphQl.scaffold.generate({
            //     ...options,
            //     input: {
            //         showConfirmation: false,
            //         dataModelName: input.dataModelName,
            //         pluginsFolderPath: input.graphqlPluginsFolderPath
            //     }
            // });
            //
            // ora.start(`Creating new plugins in ${chalk.green(adminNewCodePath)}...`);
            // await wait(1000);
            //
            // fs.mkdirSync(adminNewCodePath, { recursive: true });
            //
            // await ncp(templateFolderPath, adminNewCodePath);
            //
            // // Replace generic "Target" with received "dataModelName" argument.
            // const codeReplacements = [
            //     { find: "targetDataModels", replaceWith: Case.camel(dataModelName.plural) },
            //     { find: "TargetDataModels", replaceWith: Case.pascal(dataModelName.plural) },
            //     { find: "TARGET_DATA_MODELS", replaceWith: Case.constant(dataModelName.plural) },
            //     { find: "target-data-models", replaceWith: Case.kebab(dataModelName.plural) },
            //     { find: "Target Data Models", replaceWith: Case.title(dataModelName.plural) },
            //
            //     { find: "targetDataModel", replaceWith: Case.camel(dataModelName.singular) },
            //     { find: "TargetDataModel", replaceWith: Case.pascal(dataModelName.singular) },
            //     { find: "TARGET_DATA_MODEL", replaceWith: Case.constant(dataModelName.singular) },
            //     { find: "target-data-model", replaceWith: Case.kebab(dataModelName.singular) },
            //     { find: "Target Data Model", replaceWith: Case.title(dataModelName.singular) }
            // ];
            //
            // replaceInPath(path.join(adminNewCodePath, "/**/*.ts"), codeReplacements);
            // replaceInPath(path.join(adminNewCodePath, "/**/*.tsx"), codeReplacements);
            //
            // const fileNameReplacements = [
            //     {
            //         find: "views/TargetDataModelsDataList.tsx",
            //         replaceWith: `views/${Case.pascal(dataModelName.plural)}DataList.tsx`
            //     },
            //     {
            //         find: "views/TargetDataModelsForm.tsx",
            //         replaceWith: `views/${Case.pascal(dataModelName.plural)}Form.tsx`
            //     },
            //
            //     {
            //         find: "views/hooks/useTargetDataModelsForm.ts",
            //         replaceWith: `views/hooks/use${Case.pascal(dataModelName.plural)}Form.ts`
            //     },
            //     {
            //         find: "views/hooks/useTargetDataModelsDataList.ts",
            //         replaceWith: `views/hooks/use${Case.pascal(dataModelName.plural)}DataList.ts`
            //     }
            // ];
            //
            // for (const fileNameReplacement of fileNameReplacements) {
            //     fs.renameSync(
            //         path.join(adminNewCodePath, fileNameReplacement.find),
            //         path.join(adminNewCodePath, fileNameReplacement.replaceWith)
            //     );
            // }
            //
            // ora.stopAndPersist({
            //     symbol: chalk.green("✔"),
            //     text: `New plugins created in ${chalk.green(adminNewCodePath)}.`
            // });
            //
            // ora.start(`Importing created plugins in ${chalk.green(adminScaffoldsIndexPath)}.`);
            // await wait(1000);
            //
            // createScaffoldsIndexFile(adminScaffoldsPath);
            // await updateScaffoldsIndexFile({
            //     scaffoldsIndexPath: adminScaffoldsIndexPath,
            //     importName: dataModelName.plural,
            //     importPath: `./${dataModelName.plural}`
            // });
            //
            // ora.stopAndPersist({
            //     symbol: chalk.green("✔"),
            //     text: `Imported created plugins in ${chalk.green(adminScaffoldsIndexPath)}.`
            // });
            //
            // await formatCode(["**/*.ts", "**/*.tsx"], { cwd: adminNewCodePath });
        },
        onSuccess: async () => {
            console.log();
            console.log(`${chalk.green("✔")} New React application created successfully.`);
            console.log();
            console.log(chalk.bold("Next Steps"));

            console.log(
                `‣ deploy the extended GraphQL API and continue developing by running the ${chalk.green(
                    "yarn webiny watch api/code/graphql --env dev"
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
