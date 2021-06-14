import fs from "fs";
import path from "path";
import util from "util";
import ncpBase from "ncp";
import pluralize from "pluralize";
import Case from "case";
import { replaceInPath } from "replace-in-path";
import chalk from "chalk";
import indentString from "indent-string";
import { CliCommandScaffoldTemplate } from "@webiny/cli-plugin-scaffold/types";
import prettier from "prettier";
import {
    createScaffoldsIndexFile,
    updateScaffoldsIndexFile,
    formatCode
} from "@webiny/cli-plugin-scaffold/utils";

const ncp = util.promisify(ncpBase.ncp);

interface Input {
    pluginsFolderPath: string;
    dataModelName: string;
}

const createPackageName = ({
    initial,
    location
}: {
    initial?: string;
    location: string;
}): string => {
    if (initial) {
        return initial;
    }
    return Case.kebab(location);
};

export default (): CliCommandScaffoldTemplate<Input> => ({
    name: "cli-plugin-scaffold-template-graphql-service",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "Extend GraphQL API",
        questions: () => {
            return [
                {
                    name: "dataModelName",
                    message: "Enter initial data model name:",
                    default: "Book",
                    validate: name => {
                        if (!name.match(/^([a-zA-Z]+)$/)) {
                            return "A valid targetDataModel name must consist of letters only.";
                        }

                        return true;
                    }
                },
                {
                    name: "pluginsFolderPath",
                    message: "Enter plugins folder path:",
                    default: `api/code/graphql/src/plugins`,
                    validate: location => {
                        if (location.length < 2) {
                            return "Please enter the package location.";
                        }

                        return true;
                    }
                }
            ];
        },
        generate: async ({ input, ora }) => {
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
            const templateFolderPath = path.join(__dirname, "template");

            fs.mkdirSync(newCodePath, { recursive: true });
            await ncp(templateFolderPath, newCodePath);

            // Replace generic "Target" with received "dataModelName" argument.
            const codeReplacements = [
                { find: "targetDataModels", replaceWith: Case.camel(dataModelName.plural) },
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

            createScaffoldsIndexFile(scaffoldsPath);
            await updateScaffoldsIndexFile({
                scaffoldsIndexPath,
                importName: dataModelName.plural,
                importPath: `./graphql/${dataModelName.plural}`
            });

            await formatCode(["**/*.ts"], { cwd: newCodePath });

            return;
            // Format all generated code.
            await prettier.resolveConfig(process.cwd()).then(options => {
                console.log("dibeiiii", options);
            });

            return;

            /*      const project = getProject();

            const locationRelative = path.relative(project.root, fullPluginsFolderPath);

            const packageName = createPackageName({
                initial: initialPackageName,
                location
            });
            //
            const templateFolder = path.join(__dirname, "template");

            if (fs.existsSync(location)) {
                throw new Error(`Destination folder ${location} already exists!`);
            }

            // Get base TS config path
            const baseTsConfigFullPath = findUp.sync("tsconfig.json", {
                cwd: fullPluginsFolderPath
            });
            const baseTsConfigRelativePath = path
                .relative(fullPluginsFolderPath, baseTsConfigFullPath)
                .replace(/\\/g, "/");

            const baseTsConfigBuildJsonPath = baseTsConfigFullPath.replace(
                "tsconfig.json",
                "tsconfig.build.json"
            );
            const baseTsConfigBuildJson = await readJson<TsConfigJson>(baseTsConfigBuildJsonPath);

            ora.start(`Creating service files in ${chalk.green(fullPluginsFolderPath)}...`);

            const relativeRootPath = path.relative(fullPluginsFolderPath, project.root);

            await fs.mkdirSync(location, { recursive: true });

            // Copy template files
            await ncp(templateFolder, fullPluginsFolderPath);

            const graphqlPath = path.relative(process.cwd(), "api/code/graphql");

            // Replace generic "Target" with received "entityName" argument.
            const entity = {
                plural: pluralize(Case.camel(dataModelName)),
                singular: pluralize.singular(Case.camel(dataModelName))
            };

            const codeReplacements = [
                { find: "targetDataModelKebabCase", replaceWith: Case.kebab(entity.singular) },
                { find: "targetDataModels", replaceWith: Case.camel(entity.plural) },
                { find: "Targets", replaceWith: Case.pascal(entity.plural) },
                { find: "TARGETS", replaceWith: Case.constant(entity.plural) },
                { find: "targetDataModel", replaceWith: Case.camel(entity.singular) },
                { find: "Target", replaceWith: Case.pascal(entity.singular) },
                { find: "TARGET", replaceWith: Case.constant(entity.singular) },
                { find: "RELATIVE_ROOT_PATH", replaceWith: relativeRootPath.replace(/\\/g, "/") },
                { find: "packageName", replaceWith: packageName },
                { find: "packageLocation", replaceWith: location },
                { find: "graphQlIndexFile", replaceWith: `${graphqlPath}//index.ts` },
                { find: "location", replaceWith: location }
            ];

            replaceInPath(path.join(fullPluginsFolderPath, ".babelrc.js"), codeReplacements);
            replaceInPath(path.join(fullPluginsFolderPath, "jest.config.js"), codeReplacements);
            replaceInPath(
                path.join(fullPluginsFolderPath, "jest-dynalite-config.js"),
                codeReplacements
            );
            replaceInPath(path.join(fullPluginsFolderPath, "/!**!/!*.ts"), codeReplacements);
            replaceInPath(path.join(fullPluginsFolderPath, "__tests__/!**!/!*.ts"), codeReplacements);
            replaceInPath(path.join(fullPluginsFolderPath, "README.md"), codeReplacements);

            // Make sure to also rename base file names.
            const fileNameReplacements = [
                {
                    find: "__tests__/graphql/targetDataModels.ts",
                    replaceWith: `__tests__/graphql/${entity.plural}.ts`
                },
                {
                    find: "/resolvers/createTarget.ts",
                    replaceWith: `/resolvers/create${Case.pascal(entity.singular)}.ts`
                },
                {
                    find: "/resolvers/deleteTarget.ts",
                    replaceWith: `/resolvers/delete${Case.pascal(entity.singular)}.ts`
                },
                {
                    find: "/resolvers/getTarget.ts",
                    replaceWith: `/resolvers/get${Case.pascal(entity.singular)}.ts`
                },
                {
                    find: "/resolvers/listTargets.ts",
                    replaceWith: `/resolvers/list${Case.pascal(entity.plural)}.ts`
                },
                {
                    find: "/resolvers/updateTarget.ts",
                    replaceWith: `/resolvers/update${Case.pascal(entity.singular)}.ts`
                }
            ];

            for (const fileNameReplacement of fileNameReplacements) {
                fs.renameSync(
                    path.join(fullPluginsFolderPath, fileNameReplacement.find),
                    path.join(fullPluginsFolderPath, fileNameReplacement.replaceWith)
                );
            }

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Service files created in ${chalk.green(fullPluginsFolderPath)}.`
            });

            // Update root package.json - update "workspaces.packages" section.
            ora.start(
                `Adding ${chalk.green(location)} workspace in root ${chalk.green(
                    `package.json`
                )}...`
            );
            const rootPackageJsonPath = path.join(project.root, "package.json");
            const rootPackageJson = await readJson<PackageJson>(rootPackageJsonPath);
            if (!rootPackageJson.workspaces.packages.includes(location)) {
                rootPackageJson.workspaces.packages.push(location);
                await writeJson(rootPackageJsonPath, rootPackageJson);
            }

            ora.start(`Adding ${chalk.green(packageName)} to api package.json.`);
            const graphqlPackageJsonPath = path.resolve(graphqlPath, "package.json");
            const graphqlPackageJson = await readJson<PackageJson>(graphqlPackageJsonPath);
            graphqlPackageJson.dependencies[packageName] = "^1.0.0";
            await writeJson(graphqlPackageJsonPath, graphqlPackageJson);

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Added ${chalk.green(packageName)} to api package.json.`
            });

            ora.start(`Updating api tsconfig.json.`);
            // Update graphql tsconfig file
            const graphqlTsconfigPath = path.resolve(graphqlPath, "tsconfig.json");
            const packagePathRelativeToGraphql = path.relative(graphqlPath, fullPluginsFolderPath);
            const graphqlTsconfig = readJson.sync<TsConfigJson>(graphqlTsconfigPath);
            graphqlTsconfig.references = (graphqlTsconfig.references || []).concat([
                {
                    path: packagePathRelativeToGraphql
                }
            ]);
            await writeJson(graphqlTsconfigPath, graphqlTsconfig);
            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Workspace ${chalk.green(location)} added in root ${chalk.green(
                    `package.json`
                )}.`
            });

            ora.start(`Updating package name...`);

            // Update the package's name
            const packageJsonPath = path.resolve(location, "package.json");
            const packageJson = await readJson<PackageJson>(packageJsonPath);
            packageJson.name = packageName;

            const { version } = require("@webiny/cli-plugin-scaffold/package.json");

            // Inject Webiny packages version
            Object.keys(packageJson.dependencies).forEach(name => {
                if (name.startsWith("@webiny")) {
                    packageJson.dependencies[name] = version;
                }
            });

            Object.keys(packageJson.devDependencies).forEach(name => {
                if (name.startsWith("@webiny")) {
                    packageJson.devDependencies[name] = version;
                }
            });

            await writeJson(packageJsonPath, packageJson);
            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Package name set into ${chalk.green(`package.json`)}.`
            });

            // Update package tsconfig "extends" path
            ora.start(`Updating package tsconfig extends path to root tsconfig...`);
            const tsConfigPath = path.join(fullPluginsFolderPath, "tsconfig.json");
            const tsConfig = await readJson<TsConfigJson>(tsConfigPath);
            tsConfig.extends = baseTsConfigRelativePath;
            await writeJson(tsConfigPath, tsConfig);
            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Update package tsconfig extends path.`
            });

            // Update package tsconfig.build "extends" path
            ora.start(`Updating package tsconfig.build extends path to root tsconfig.build...`);
            const tsConfigBuildPath = tsConfigPath.replace("tsconfig.json", "tsconfig.build.json");
            const tsConfigBuild = await readJson<TsConfigJson>(tsConfigBuildPath);
            tsConfigBuild.extends = baseTsConfigRelativePath.replace(
                "tsconfig.json",
                "tsconfig.build.json"
            );
            await writeJson(tsConfigBuildPath, tsConfigBuild);
            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Update package tsconfig.build extends path.`
            });

            // Update root tsconfig.build.json file paths
            ora.start(`Updating base tsconfig compilerOptions.paths to contain the package...`);
            if (!baseTsConfigBuildJson.compilerOptions) {
                baseTsConfigBuildJson.compilerOptions = {};
            }
            baseTsConfigBuildJson.compilerOptions.paths[`${packageName}`] = [
                `./${locationRelative}/src`
            ];
            baseTsConfigBuildJson.compilerOptions.paths[`${packageName}/!*`] = [
                `./${locationRelative}//!*`
            ];
            await writeJson(baseTsConfigBuildJsonPath, baseTsConfigBuildJson);
            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Updated base tsconfig compilerOptions.paths.`
            });

            // Once everything is done, run `yarn` so the new packages are automatically installed.
            try {
                ora.start(`Installing dependencies...`);
                await execa("yarn");
                ora.stopAndPersist({
                    symbol: chalk.green("✔"),
                    text: "Dependencies installed."
                });
                ora.start(`Building generated package...`);
                const cwd = process.cwd();
                process.chdir(location);
                await execa("yarn", ["build"]);
                process.chdir(cwd);
                ora.stopAndPersist({
                    symbol: chalk.green("✔"),
                    text: "Package built."
                });
                ora.start(`Linking package...`);
                await execa("yarn", ["postinstall"]);
                ora.stopAndPersist({
                    symbol: chalk.green("✔"),
                    text: "Package linked."
                });
            } catch (err) {
                throw new WebinyError(
                    `Unable to install dependencies. Try running "yarn" in project root manually.`,
                    err.message
                );
            }*/
        },
        onSuccess: async ({ input }) => {
            const { location, dataModelName, packageName: initialPackageName } = input;

            const entity = {
                singular: Case.camel(dataModelName),
                plural: pluralize(Case.camel(dataModelName))
            };

            const packageName = createPackageName({
                initial: initialPackageName,
                location
            });

            const graphqlPath = path.relative(process.cwd(), "./api/code/graphql");
            const graphqlSrcPath = `${path.relative(process.cwd(), `${graphqlPath}/src`)}`;

            console.log(`The next steps:`);
            console.log(
                indentString(
                    `1. Open ${chalk.green(
                        `${graphqlSrcPath}/index.ts`
                    )} and copy the code into it:`,
                    2
                )
            );

            console.log(
                indentString(
                    `3. Deploy the ${chalk.green(packageName)} by running ${chalk.green(
                        `yarn webiny deploy api --env=dev`
                    )}.`,
                    2
                )
            );
        }
    }
});
