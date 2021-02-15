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

const ncp = util.promisify(ncpBase.ncp);

export default (): CliCommandScaffoldTemplate => ({
    name: "cli-plugin-scaffold-template-graphql-service",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "GraphQL Webiny Service",
        questions: () => {
            return [
                {
                    name: "location",
                    message: "Enter package location (including package name)",
                    default: "api/code/books",
                    validate: location => {
                        if (location.length < 2) {
                            return "Please enter a package location";
                        }

                        if (fs.existsSync(path.resolve(location))) {
                            return "The target location already exists";
                        }

                        return true;
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
            const { location, entityName } = input;
            const fullLocation = path.resolve(location);

            const projectRootPath = path.dirname(
                findUp.sync("webiny.root.js", {
                    cwd: fullLocation
                })
            );

            const packageName = Case.kebab(location);

            //
            const templateFolder = path.join(__dirname, "../template");

            if (fs.existsSync(location)) {
                throw new Error(`Destination folder ${location} already exists!`);
            }

            oraSpinner.start(`Creating service files in ${chalk.green(fullLocation)}...`);

            const relativeRootPath = path.relative(fullLocation, projectRootPath);

            await fs.mkdirSync(location, { recursive: true });

            // Get base TS config path
            const baseTsConfigPath = path
                .relative(
                    fullLocation,
                    findUp.sync("tsconfig.json", {
                        cwd: fullLocation
                    })
                )
                .replace(/\\/g, "/");

            // Copy template files
            await ncp(templateFolder, fullLocation);

            // Replace generic "Target" with received "input.entityName" argument.
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
                },
                {
                    find: "example.tsconfig.json",
                    replaceWith: "tsconfig.json"
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
                `Adding ${chalk.green(input.location)} workspace in root ${chalk.green(
                    `package.json`
                )}..`
            );

            const rootPackageJsonPath = path.join(projectRootPath, "package.json");
            const rootPackageJson = await readJson<PackageJson>(rootPackageJsonPath);
            if (!rootPackageJson.workspaces.packages.includes(input.location)) {
                rootPackageJson.workspaces.packages.push(input.location);
                await writeJson(rootPackageJsonPath, rootPackageJson);
            }

            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Workspace ${chalk.green(input.location)} added in root ${chalk.green(
                    `package.json`
                )}.`
            });

            // Update the package's name
            const packageJsonPath = path.resolve(location, "package.json");
            const packageJson = await readJson<PackageJson>(packageJsonPath);
            packageJson.name = packageName;
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

            // Update tsconfig "extends" path
            const tsConfigPath = path.join(fullLocation, "tsconfig.json");
            const tsconfig = await readJson<TsConfigJson>(tsConfigPath);
            tsconfig.extends = baseTsConfigPath;
            fs.writeFileSync(tsConfigPath, JSON.stringify(tsconfig, null, 2));

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
            const { location } = input;
            console.log(`The next steps:`);
            console.log(
                indentString(
                    `1. In ${chalk.green(
                        "api/code/graphql/index.ts"
                    )} import your plugin file ${chalk.green(
                        `${location}/index.ts`
                    )} and load plugins in the handler.`,
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
                `Learn more about API development at https://docs.webiny.com/docs/api-development/introduction`
            );
        }
    }
});
