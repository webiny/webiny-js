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
import { CliCommandScaffoldTemplate, PackageJson } from "@webiny/cli-plugin-scaffold/types";
import findUp from "find-up";
import execa from "execa";
import link from "terminal-link";
import {
    createScaffoldsIndexFile,
    updateScaffoldsIndexFile,
    formatCode,
    LAST_USED_GQL_API_PLUGINS_PATH
} from "@webiny/cli-plugin-scaffold/utils";
import getContextMeta from "./getContextMeta";
import { projectHasCodeFolders } from "./utils";

const ncp = util.promisify(ncpBase.ncp);

interface Input {
    pluginsFolderPath: string;
    dataModelName: string;
    showConfirmation?: boolean;
}

type DependenciesUpdates = [
    "devDependencies" | "dependencies" | "peerDependencies",
    string,
    string
];

const SCAFFOLD_DOCS_LINK =
    "https://www.webiny.com/docs/how-to-guides/scaffolding/extend-graphql-api";

export default (): CliCommandScaffoldTemplate<Input> => ({
    name: "cli-plugin-scaffold-graphql",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "Extend GraphQL API",
        description:
            "Extends your GraphQL API with new CRUD query and mutation operations." +
            (link.isSupported ? "\n  " + link("Learn more.", SCAFFOLD_DOCS_LINK) : ""),
        questions: ({ context }) => {
            const projectWithCodeFolders = projectHasCodeFolders(context.project.root);

            return [
                {
                    name: "pluginsFolderPath",
                    message: "Enter plugins folder path:",
                    default: () => {
                        let suffixPath = "/graphql/src/plugins";
                        if (projectWithCodeFolders) {
                            suffixPath = "/code" + suffixPath;
                        }

                        return (
                            context.localStorage.get(LAST_USED_GQL_API_PLUGINS_PATH) ||
                            `apps/api${suffixPath}`
                        );
                    },
                    validate: (pluginsFolderPath: string) => {
                        if (pluginsFolderPath.length < 2) {
                            return `Please enter GraphQL API ${chalk.cyan("plugins")} folder path.`;
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

                        const newCodePath = path.resolve(
                            path.join(
                                answers.pluginsFolderPath,
                                "scaffolds",
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
            context.localStorage.set(LAST_USED_GQL_API_PLUGINS_PATH, input.pluginsFolderPath);

            // Store used input, so that maybe some of
            const dataModelName = {
                plural: pluralize(Case.camel(input.dataModelName)),
                singular: pluralize.singular(Case.camel(input.dataModelName))
            };

            const scaffoldsPath = path.join(input.pluginsFolderPath, "scaffolds");
            const scaffoldsIndexPath = path.join(scaffoldsPath, "index.ts");
            const newCodePath = path.join(scaffoldsPath, Case.camel(dataModelName.plural));
            const packageJsonPath = path.relative(
                context.project.root,
                findUp.sync("package.json", { cwd: input.pluginsFolderPath }) as string
            );
            const templateFolderPath = path.join(__dirname, "template");

            // Get needed dependencies updates.
            const dependenciesUpdates: DependenciesUpdates[] = [];
            const packageJson = await loadJsonFile<PackageJson>(packageJsonPath);
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

            // Remove I18N and Security-related code if the GraphQL API doesn't support those.
            // Support is being detected via `Context` type, defined within the root types.ts file.
            const typesTsPath = findUp.sync("types.ts", { cwd: input.pluginsFolderPath });
            if (typesTsPath) {
                const meta = getContextMeta(typesTsPath);
                if (!meta.i18n) {
                    // If I18NContext was not detected, remove relevant I18N code.
                    replaceInPath(
                        path.join(newCodePath, "/resolvers/TargetDataModelsResolver.ts"),
                        {
                            find: new RegExp(
                                "\\/\\/ If our .*base = `L#\\${locale}#\\${base}`;",
                                "s"
                            ),
                            replaceWith: ""
                        }
                    );
                }

                if (!meta.security) {
                    {
                        // If SecurityContext was not detected, comment out relevant SecurityContext code.
                        const codeReplacements = [
                            {
                                find: new RegExp('\\/\\/ If our GraphQL API.*\\/types";\\n', "s"),
                                replaceWith: ""
                            },
                            {
                                find: new RegExp("createdBy: Pick<SecurityIdentity.*\\n"),
                                replaceWith: ""
                            }
                        ];
                        replaceInPath(path.join(newCodePath, "/types.ts"), codeReplacements);
                    }

                    {
                        // If SecurityContext was not detected, comment out relevant SecurityContext code.
                        const codeReplacements = [
                            {
                                find: new RegExp("\\/\\/ If our GraphQL API.*context;\\n", "s"),
                                replaceWith: ""
                            },
                            {
                                find: new RegExp("const identity = await security.*?\\n"),
                                replaceWith: ""
                            },
                            {
                                find: new RegExp("createdBy: identity && \\{.*\\},\\n", "s"),
                                replaceWith: ""
                            }
                        ];

                        replaceInPath(
                            path.join(newCodePath, "/resolvers/TargetDataModelsMutation.ts"),
                            codeReplacements
                        );
                    }

                    {
                        // If SecurityContext was not detected, comment out relevant SecurityContext code.
                        const codeReplacements = [
                            {
                                find: new RegExp("type TargetDataModelCreatedBy {.*?}\\n", "s"),
                                replaceWith: ""
                            },
                            {
                                find: new RegExp("createdBy: TargetDataModelCreatedBy\\n"),
                                replaceWith: ""
                            }
                        ];
                        replaceInPath(path.join(newCodePath, "/typeDefs.ts"), codeReplacements);
                    }

                    {
                        // If SecurityContext was not detected, comment out relevant SecurityContext code.
                        const codeReplacements = [
                            {
                                find: new RegExp('createdBy: { type: "map" },\\n'),
                                replaceWith: ""
                            }
                        ];
                        replaceInPath(
                            path.join(newCodePath, "/entities/TargetDataModel.ts"),
                            codeReplacements
                        );
                    }
                }
            }

            // Replace generic "TargetDataModel" with received "dataModelName" argument.
            const codeReplacements = [
                { find: "targetDataModels", replaceWith: Case.camel(dataModelName.plural) },
                { find: "TargetDataModels", replaceWith: Case.pascal(dataModelName.plural) },
                { find: "TARGET_DATA_MODELS", replaceWith: Case.constant(dataModelName.plural) },

                { find: "targetDataModel", replaceWith: Case.camel(dataModelName.singular) },
                { find: "TargetDataModel", replaceWith: Case.pascal(dataModelName.singular) },
                { find: "TARGET_DATA_MODEL", replaceWith: Case.constant(dataModelName.singular) }
            ];

            replaceInPath(path.join(newCodePath, "/**/*.ts"), codeReplacements);

            const fileNameReplacements = [
                {
                    find: "__tests__/graphql/targetDataModels.ts",
                    replaceWith: `__tests__/graphql/${dataModelName.plural}.ts`
                },
                {
                    find: "/entities/TargetDataModel.ts",
                    replaceWith: `/entities/${Case.pascal(dataModelName.singular)}.ts`
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
                importPath: `./${dataModelName.plural}`
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
        onSuccess: async ({ context }) => {
            console.log();
            console.log(
                `${chalk.green("✔")} New GraphQL API plugins created and imported successfully.`
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
                    `yarn webiny watch apps/api/${suffixPath} --env dev`
                )} command`
            );

            console.log();
            console.log(chalk.bold("Useful Links"));

            const links = [
                ["Extend GraphQL API", SCAFFOLD_DOCS_LINK],
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
