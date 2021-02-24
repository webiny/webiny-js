import WebinyError from "@webiny/error";
import fs from "fs";
import path from "path";
import util from "util";
import ncpBase from "ncp";
import findUp from "find-up";
import readJson from "load-json-file";
import writeJson from "write-json-file";
import pluralize from "pluralize";
import Case from "case";
import { replaceInPath } from "replace-in-path";
import execa from "execa";
import chalk from "chalk";
import indentString from "indent-string";
import {
    CliCommandScaffoldTemplate,
    PackageJson,
    TsConfigJson
} from "@webiny/cli-plugin-scaffold/types";
import validateNpmPackageName from "validate-npm-package-name";

const ncp = util.promisify(ncpBase.ncp);

interface Input {
    location: string;
    entityName: string;
    packageName?: string;
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
        name: "GraphQL Webiny Service",
        questions: () => {
            return [
                {
                    name: "location",
                    message: "Enter package location (including the package name)",
                    default: "p/books/api",
                    validate: location => {
                        if (location.length < 2) {
                            return "Please enter the package location.";
                        }

                        if (fs.existsSync(path.resolve(location))) {
                            return "The target location already exists.";
                        }

                        return true;
                    }
                },
                {
                    name: "packageName",
                    message: "Enter package name",
                    default: answers => {
                        return Case.kebab(answers.location);
                    },
                    validate: packageName => {
                        if (!packageName) {
                            return true;
                        } else if (validateNpmPackageName(packageName)) {
                            return true;
                        }
                        return `Package name must look something like "@package/my-generated-package".`;
                    }
                },
                {
                    name: "entityName",
                    message: "Enter name of the initial data model",
                    default: "Book",
                    validate: name => {
                        if (!name.match(/^([a-zA-Z]+)$/)) {
                            return "A valid target name must consist of letters only.";
                        }

                        return true;
                    }
                }
            ];
        },
        generate: async ({ input, oraSpinner }) => {
            const { location, entityName, packageName: initialPackageName } = input;
            const fullLocation = path.resolve(location);

            const projectRootPath = path.dirname(
                findUp.sync("webiny.root.js", {
                    cwd: fullLocation
                })
            );
            const locationRelative = path.relative(projectRootPath, fullLocation);

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
                cwd: fullLocation
            });
            const baseTsConfigRelativePath = path
                .relative(fullLocation, baseTsConfigFullPath)
                .replace(/\\/g, "/");

            const baseTsConfigBuildJsonPath = baseTsConfigFullPath.replace(
                "tsconfig.json",
                "tsconfig.build.json"
            );
            const baseTsConfigBuildJson = await readJson<TsConfigJson>(baseTsConfigBuildJsonPath);

            oraSpinner.start(`Creating service files in ${chalk.green(fullLocation)}...`);

            const relativeRootPath = path.relative(fullLocation, projectRootPath);

            await fs.mkdirSync(location, { recursive: true });

            // Copy template files
            await ncp(templateFolder, fullLocation);

            // Replace generic "Target" with received "entityName" argument.
            const entity = {
                plural: pluralize(Case.camel(entityName)),
                singular: pluralize.singular(Case.camel(entityName))
            };

            const codeReplacements = [
                { find: "targets", replaceWith: Case.camel(entity.plural) },
                { find: "Targets", replaceWith: Case.pascal(entity.plural) },
                { find: "TARGETS", replaceWith: Case.constant(entity.plural) },
                { find: "target", replaceWith: Case.camel(entity.singular) },
                { find: "Target", replaceWith: Case.pascal(entity.singular) },
                { find: "TARGET", replaceWith: Case.constant(entity.singular) },
                { find: "RELATIVE_ROOT_PATH", replaceWith: relativeRootPath.replace(/\\/g, "/") }
            ];

            replaceInPath(path.join(fullLocation, ".babelrc.js"), codeReplacements);
            replaceInPath(path.join(fullLocation, "jest.config.js"), codeReplacements);
            replaceInPath(path.join(fullLocation, "jest-dynalite-config.js"), codeReplacements);
            replaceInPath(path.join(fullLocation, "src/**/*.ts"), codeReplacements);
            replaceInPath(path.join(fullLocation, "__tests__/**/*.ts"), codeReplacements);

            // Make sure to also rename base file names.
            const fileNameReplacements = [
                {
                    find: "__tests__/graphql/targets.ts",
                    replaceWith: `__tests__/graphql/${entity.plural}.ts`
                }
            ];

            for (const fileNameReplacement of fileNameReplacements) {
                fs.renameSync(
                    path.join(fullLocation, fileNameReplacement.find),
                    path.join(fullLocation, fileNameReplacement.replaceWith)
                );
            }

            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Service files created in ${chalk.green(fullLocation)}.`
            });

            // Update root package.json - update "workspaces.packages" section.
            oraSpinner.start(
                `Adding ${chalk.green(location)} workspace in root ${chalk.green(
                    `package.json`
                )}...`
            );

            // Add package to workspaces
            const rootPackageJsonPath = path.join(projectRootPath, "package.json");
            const rootPackageJson = await readJson<PackageJson>(rootPackageJsonPath);
            if (!rootPackageJson.workspaces.packages.includes(location)) {
                rootPackageJson.workspaces.packages.push(location);
                await writeJson(rootPackageJsonPath, rootPackageJson);
            }

            // Update graphql tsconfig file
            const graphqlPath = path.relative(process.cwd(), "./api/code/graphql");
            const graphqlTsconfigPath = path.resolve(graphqlPath, "tsconfig.json");
            const packagePathRelativeToGraphql = path.relative(graphqlPath, fullLocation);
            const graphqlTsconfig = readJson.sync<TsConfigJson>(graphqlTsconfigPath);
            graphqlTsconfig.include = (graphqlTsconfig.include || []).concat([
                packagePathRelativeToGraphql
            ]);
            graphqlTsconfig.references = (graphqlTsconfig.references || []).concat([
                {
                    path: packagePathRelativeToGraphql
                }
            ]);
            await writeJson(graphqlTsconfigPath, graphqlTsconfig);
            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Workspace ${chalk.green(location)} added in root ${chalk.green(
                    `package.json`
                )}.`
            });

            oraSpinner.start(`Updating package name...`);

            // Update the package's name
            const packageJsonPath = path.resolve(location, "package.json");
            const packageJson = await readJson<PackageJson>(packageJsonPath);
            packageJson.name = packageName;
            await writeJson(packageJsonPath, packageJson);
            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Package name set into ${chalk.green(`package.json`)}.`
            });

            // Update package tsconfig "extends" path
            oraSpinner.start(`Updating package tsconfig extends path to root tsconfig...`);
            const tsConfigPath = path.join(fullLocation, "tsconfig.json");
            const tsConfig = await readJson<TsConfigJson>(tsConfigPath);
            tsConfig.extends = baseTsConfigRelativePath;
            await writeJson(tsConfigPath, tsConfig);
            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Update package tsconfig extends path.`
            });

            // Update package tsconfig.build "extends" path
            oraSpinner.start(
                `Updating package tsconfig.build extends path to root tsconfig.build...`
            );
            const tsConfigBuildPath = tsConfigPath.replace("tsconfig.json", "tsconfig.build.json");
            const tsConfigBuild = await readJson<TsConfigJson>(tsConfigBuildPath);
            tsConfigBuild.extends = baseTsConfigRelativePath.replace(
                "tsconfig.json",
                "tsconfig.build.json"
            );
            await writeJson(tsConfigBuildPath, tsConfigBuild);
            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Update package tsconfig.build extends path.`
            });

            // Update root tsconfig.build.json file paths
            if (!baseTsConfigBuildJson.compilerOptions) {
                baseTsConfigBuildJson.compilerOptions = {};
            }
            baseTsConfigBuildJson.compilerOptions.paths[`${packageName}`] = [
                `./${locationRelative}/src`
            ];
            baseTsConfigBuildJson.compilerOptions.paths[`${packageName}/*`] = [
                `./${locationRelative}/src/*`
            ];
            await writeJson(baseTsConfigBuildJsonPath, baseTsConfigBuildJson);

            // Once everything is done, run `yarn` so the new packages are automatically installed.
            try {
                oraSpinner.start(`Installing dependencies...`);
                await execa("yarn");
                oraSpinner.stopAndPersist({
                    symbol: chalk.green("✔"),
                    text: "Dependencies installed."
                });
            } catch (err) {
                throw new WebinyError(
                    `Unable to install dependencies. Try running "yarn" in project root manually.`,
                    err.message
                );
            }
        },
        onSuccess: async ({ input }) => {
            const { location, entityName } = input;

            const targetName = Case.camel(entityName);

            const graphqlPath = path.relative(process.cwd(), "./api/code/graphql");
            const graphqlSrcPath = `${path.relative(process.cwd(), `${graphqlPath}/src`)}`;

            const servicePath = path.relative(process.cwd(), location);
            const serviceIndexFile = path.relative(graphqlSrcPath, `${servicePath}/src`);

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
                    chalk.green(`
// at the top of the file
import ${targetName}Plugin from "${serviceIndexFile}";

// somewhere after headlessCmsPlugins() in the end of the createHandler() function
${targetName}Plugin()
`),
                    2
                )
            );

            console.log(
                indentString(
                    `2. From project root, run ${chalk.green(
                        `yarn test ${location}`
                    )} to ensure that the service works.`,
                    2
                )
            );
            console.log(
                indentString(
                    `3. Finally, deploy the ${chalk.green(location)} stack by running ${chalk.green(
                        `yarn webiny app deploy ${location} --env=dev`
                    )}.`,
                    2
                )
            );
            console.log(
                `
Learn more about API development at https://docs.webiny.com/docs/api-development/introduction
`
            );
        }
    }
});
