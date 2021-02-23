import {
    CliCommandScaffoldTemplate,
    TsConfigJson,
    PackageJson
} from "@webiny/cli-plugin-scaffold/types";
import fs from "fs";
import path from "path";
import util from "util";
import ncpBase from "ncp";
import readJson from "load-json-file";
import writeJson from "write-json-file";
import findUp from "find-up";
import pluralize from "pluralize";
import Case from "case";
import { replaceInPath } from "replace-in-path";
import chalk from "chalk";
import indentString from "indent-string";
import WebinyError from "@webiny/error";
import execa from "execa";
import validateNpmPackageName from "validate-npm-package-name";

const ncp = util.promisify(ncpBase.ncp);

interface Input {
    location: string;
    entityName: string;
    packageName?: string;
}

const adminAppCodePath = "apps/admin/code";
const adminAppPluginsPath = "apps/admin/code/src/plugins";
const adminAppPluginsIndexFile = `${adminAppCodePath}/src/plugins/index.ts`;

export default (): CliCommandScaffoldTemplate<Input> => ({
    name: "cli-plugin-scaffold-template-graphql-app",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "Admin App Module",
        questions: () => {
            return [
                {
                    name: "location",
                    message: `Enter package location (including the package name)`,
                    // default: "packages/app-books",
                    default: "p/books/app",
                    validate: location => {
                        if (!location) {
                            return "Please enter the package location.";
                        }

                        const locationPath = path.resolve(location);
                        if (fs.existsSync(locationPath)) {
                            return `The target location already exists "${location}".`;
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
                            return "A valid entity name must consist of letters only.";
                        }

                        return true;
                    }
                }
            ];
        },
        generate: async ({ input, oraSpinner }) => {
            const { entityName, location, packageName: initialPackageName } = input;

            const locationPath = path.resolve(location);
            const packageName = initialPackageName || Case.kebab(location);

            // Then we also copy the template folder
            const sourcePath = path.join(__dirname, "../template");

            if (fs.existsSync(locationPath)) {
                throw new WebinyError(`Destination folder ${locationPath} already exists.`);
            }

            // Get base TS config path
            const baseTsConfigPath = path
                .relative(
                    locationPath,
                    findUp.sync("tsconfig.json", {
                        cwd: locationPath
                    })
                )
                .replace(/\\/g, "/");

            oraSpinner.start(
                `Creating new Admin app module files in ${chalk.green(locationPath)}...`
            );

            await fs.mkdirSync(locationPath, { recursive: true });

            // Copy template files
            await ncp(sourcePath, locationPath);

            // Replace generic "Entity" with received "input.entityName" or "input.newEntityName" argument.
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
                { find: "TARGET", replaceWith: Case.constant(entity.singular) }
            ];

            replaceInPath(path.join(locationPath, "**/*.ts"), codeReplacements);
            replaceInPath(path.join(locationPath, "**/*.tsx"), codeReplacements);

            // Make sure to also rename base file names.
            const fileNameReplacements = [
                {
                    find: "src/views/EntitiesDataList.tsx",
                    replaceWith: `src/views/${Case.pascal(entity.plural)}DataList.tsx`
                },
                {
                    find: "src/views/Entities.tsx",
                    replaceWith: `src/views/${Case.pascal(entity.plural)}.tsx`
                },
                {
                    find: "src/views/EntityForm.tsx",
                    replaceWith: `src/views/${Case.pascal(entity.singular)}Form.tsx`
                }
            ];

            for (const key in fileNameReplacements) {
                if (!fileNameReplacements.hasOwnProperty(key)) {
                    continue;
                }
                const fileNameReplacement = fileNameReplacements[key];
                fs.renameSync(
                    path.join(locationPath, fileNameReplacement.find),
                    path.join(locationPath, fileNameReplacement.replaceWith)
                );
            }

            oraSpinner.info(
                "Adding package path to include section of admin app tsconfig.json file."
            );
            const packageJsonFile = path.resolve(locationPath, "package.json");
            const packageJson = readJson.sync<PackageJson>(packageJsonFile);
            packageJson.name = packageName;
            await writeJson(packageJsonFile, packageJson);
            // const adminAppTsConfig = readJson.sync<TsConfigJson>(adminAppTsConfigFilePath);
            // adminAppTsConfig.include.push(locationRelativePath);
            // await writeJson(adminAppTsConfigFilePath, adminAppTsConfig);

            const packageTsConfigFilePath = path.resolve(locationPath, "tsconfig.json");
            const packageTsConfig = readJson.sync<TsConfigJson>(packageTsConfigFilePath);
            packageTsConfig.extends = baseTsConfigPath;
            await writeJson(packageTsConfigFilePath, packageTsConfig);

            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Admin app module files created in ${chalk.green(locationPath)}.`
            });

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
            const { entityName, location } = input;

            const targetName = Case.camel(entityName);

            const adminAppPluginsIndexFileRelativePath = path.relative(
                process.cwd(),
                adminAppPluginsIndexFile
            );
            const adminAppPluginsRelativePath = path.relative(process.cwd(), adminAppPluginsPath);

            const adminAppPath = path.relative(process.cwd(), location);
            const adminAppIndexFilePath = path.relative(
                adminAppPluginsRelativePath,
                `${adminAppPath}/src`
            );

            console.log(
                "Note: in order to see your new module in the Admin app, you must register the generated plugins:"
            );

            console.log(
                indentString(
                    `1. Open ${chalk.green(adminAppPluginsIndexFileRelativePath)} file.`,
                    2
                )
            );
            console.log(
                indentString(
                    `2. Import and pass the generated plugin to the registration array.`,
                    2
                )
            );
            console.log(
                indentString(
                    chalk.green(`
// at the top of the file
import ${targetName}Plugin from "${adminAppIndexFilePath}";

// in the end of the registration array
${targetName}Plugin()
`),
                    2
                )
            );

            console.log(
                "Learn more about app development at https://docs.webiny.com/docs/app-development/introduction."
            );
        }
    }
});
