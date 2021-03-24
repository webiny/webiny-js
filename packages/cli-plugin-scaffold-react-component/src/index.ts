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
    componentName: string;
    location: string;
    packageName: string;
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
    name: "cli-plugin-scaffold-template-react-component",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "Generate a simple React component package",
        questions: () => {
            return [
                {
                    name: "componentName",
                    message: "Enter the name of the component (in pascal-case)",
                    default: "DisplayComponent",
                    validate: name => {
                        if (!name.match(/^([a-zA-Z]+)$/)) {
                            return "A valid component name must consist of letters only.";
                        } else if (!name.match(/^[A-Z]/)) {
                            return "A valid component name must start with uppercase letter.";
                        }

                        return true;
                    }
                },
                {
                    name: "location",
                    message: `Enter the package location`,
                    default: answers => {
                        return `packages/${Case.kebab(answers.componentName)}`;
                    },
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
                    message: "Enter the package name",
                    default: answers => {
                        return `@custom-components/${Case.kebab(answers.componentName)}`;
                    },
                    validate: packageName => {
                        if (!packageName) {
                            return true;
                        } else if (validateNpmPackageName(packageName)) {
                            return true;
                        }
                        return `Package name must look something like "@custom-components/display".`;
                    }
                }
            ];
        },
        generate: async ({ input, oraSpinner }) => {
            const { componentName, location, packageName: initialPackageName } = input;

            const fullLocation = path.resolve(location);
            const packageName = createPackageName({
                initial: initialPackageName,
                location
            });

            // Then we also copy the template folder
            const sourcePath = path.join(__dirname, "template");

            if (fs.existsSync(fullLocation)) {
                throw new WebinyError(`Destination folder ${fullLocation} already exists.`);
            }

            const projectRootPath = path.dirname(
                findUp.sync("webiny.root.js", {
                    cwd: fullLocation
                })
            );
            const locationRelative = path.relative(projectRootPath, fullLocation);

            const relativeRootPath = path.relative(fullLocation, projectRootPath);

            const baseTsConfigFullPath = path.resolve(projectRootPath, "tsconfig.json");
            const baseTsConfigRelativePath = path.relative(fullLocation, baseTsConfigFullPath);

            const baseTsConfigBuildJsonPath = baseTsConfigFullPath.replace(
                "tsconfig.json",
                "tsconfig.build.json"
            );
            const baseTsConfigBuildRelativePath = path.relative(
                fullLocation,
                baseTsConfigBuildJsonPath
            );
            const baseTsConfigBuildJson = await readJson<TsConfigJson>(baseTsConfigBuildJsonPath);

            oraSpinner.start(
                `Creating new Admin app module files in ${chalk.green(fullLocation)}...`
            );

            await fs.mkdirSync(fullLocation, { recursive: true });

            // Copy template files
            await ncp(sourcePath, fullLocation);

            // Replace generic "Target" with received "input.componentName"
            const name = {
                plural: pluralize(Case.camel(componentName)),
                singular: pluralize.singular(Case.camel(componentName))
            };

            const codeReplacements = [
                { find: "targets", replaceWith: Case.camel(name.plural) },
                { find: "Targets", replaceWith: Case.pascal(name.plural) },
                { find: "TARGETS", replaceWith: Case.constant(name.plural) },
                { find: "target", replaceWith: Case.camel(name.singular) },
                { find: "Target", replaceWith: Case.pascal(name.singular) },
                { find: "TARGET", replaceWith: Case.constant(name.singular) },
                { find: "PACKAGE_NAME", replaceWith: packageName },
                { find: "RELATIVE_ROOT_PATH", replaceWith: relativeRootPath.replace(/\\/g, "/") }
            ];

            replaceInPath(path.join(fullLocation, ".babelrc.js"), codeReplacements);
            replaceInPath(path.join(fullLocation, "**/*.ts"), codeReplacements);
            replaceInPath(path.join(fullLocation, "**/*.tsx"), codeReplacements);

            // Make sure to also rename base file names.
            const fileNameReplacements = [
                {
                    find: "src/Target.tsx",
                    replaceWith: `src/${Case.pascal(name.singular)}.tsx`
                }
            ];

            for (const key in fileNameReplacements) {
                if (!fileNameReplacements.hasOwnProperty(key)) {
                    continue;
                }
                const fileNameReplacement = fileNameReplacements[key];
                fs.renameSync(
                    path.join(fullLocation, fileNameReplacement.find),
                    path.join(fullLocation, fileNameReplacement.replaceWith)
                );
            }

            // Generated package file changes
            oraSpinner.start(`Setting package name...`);
            const packageJsonFile = path.resolve(fullLocation, "package.json");
            const packageJson = readJson.sync<PackageJson>(packageJsonFile);
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

            await writeJson(packageJsonFile, packageJson);
            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: "Package name set."
            });
            oraSpinner.start(`Setting tsconfig.json extends path...`);
            const packageTsConfigFilePath = path.resolve(fullLocation, "tsconfig.json");
            const packageTsConfig = readJson.sync<TsConfigJson>(packageTsConfigFilePath);
            packageTsConfig.extends = baseTsConfigRelativePath;
            await writeJson(packageTsConfigFilePath, packageTsConfig);
            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: "tsconfig.json extends set."
            });
            oraSpinner.start(`Setting tsconfig.build.json extends path...`);
            const packageTsConfigBuildFilePath = path.resolve(fullLocation, "tsconfig.build.json");
            const packageTsConfigBuild = readJson.sync<TsConfigJson>(packageTsConfigBuildFilePath);
            packageTsConfigBuild.extends = baseTsConfigBuildRelativePath;
            await writeJson(packageTsConfigBuildFilePath, packageTsConfigBuild);
            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: "tsconfig.build.json extends set."
            });

            // Add package to workspaces
            const rootPackageJsonPath = path.join(projectRootPath, "package.json");
            const rootPackageJson = await readJson<PackageJson>(rootPackageJsonPath);
            if (!rootPackageJson.workspaces.packages.includes(location)) {
                rootPackageJson.workspaces.packages.push(location);
                await writeJson(rootPackageJsonPath, rootPackageJson);
            }

            // Update root tsconfig.build.json file paths
            oraSpinner.start(
                `Updating base tsconfig compilerOptions.paths to contain the package...`
            );
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
            oraSpinner.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Updated base tsconfig compilerOptions.paths.`
            });

            // Once everything is done, run `yarn` so the new packages are automatically installed.
            try {
                oraSpinner.start(`Installing dependencies...`);
                await execa("yarn");
                oraSpinner.stopAndPersist({
                    symbol: chalk.green("✔"),
                    text: "Dependencies installed."
                });
                oraSpinner.start(`Building generated package...`);
                const cwd = process.cwd();
                process.chdir(fullLocation);
                await execa("yarn", ["build"]);
                process.chdir(cwd);
                oraSpinner.stopAndPersist({
                    symbol: chalk.green("✔"),
                    text: "Package built."
                });
                oraSpinner.start(`Linking package...`);
                await execa("yarn", ["postinstall"]);
                oraSpinner.stopAndPersist({
                    symbol: chalk.green("✔"),
                    text: "Package linked."
                });
            } catch (err) {
                throw new WebinyError(
                    `Unable to install dependencies. Try running "yarn" in project root manually.`,
                    err.message
                );
            }
        },
        onSuccess: async ({ input }) => {
            const { componentName, location, packageName: initialPackageName } = input;

            const name = Case.pascal(componentName);
            const packageName = createPackageName({
                initial: initialPackageName,
                location
            });

            console.log("1. Include the package in your applications package.json file:");
            console.log(
                indentString(
                    chalk.green(`
// somewhere in your dependencies
"${packageName}": "^1.0.0"
`),
                    2
                )
            );

            console.log("2. Import your component:");
            console.log(
                indentString(
                    chalk.green(`
// at the top of the file
import { ${name} } from "${packageName}";

// use in the code
<${name} />
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
