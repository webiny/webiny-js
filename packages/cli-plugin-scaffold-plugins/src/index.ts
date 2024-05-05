import { CliCommandScaffoldTemplate, PackageJson } from "@webiny/cli-plugin-scaffold/types";
import fs from "fs";
import path from "path";
import util from "util";
import ncpBase from "ncp";
import readJson from "load-json-file";
import writeJson from "write-json-file";
import execa from "execa";
import Case from "case";
import { replaceInPath } from "replace-in-path";
import WebinyError from "@webiny/error";
import validateNpmPackageName from "validate-npm-package-name";
/**
 * TODO: rewrite cli into typescript
 */
// @ts-expect-error
import { getProject } from "@webiny/cli/utils";
import { generators } from "./generators";

const ncp = util.promisify(ncpBase.ncp);

interface Input {
    pluginName: string;
    packageName: string;
    location: string;
    pluginType: string;
}

export default (): CliCommandScaffoldTemplate<Input> => ({
    name: "cli-plugin-scaffold-template-plugin",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "New Plugin",
        description: "Scaffolds essential files for creating a new plugin.",
        questions: () => {
            return [
                {
                    name: "pluginType",
                    message: "What type of a plugin you want to create?",
                    type: "list",
                    choices: [
                        { name: "Admin plugin", value: "admin" },
                        { name: "API plugin", value: "api" }
                    ]
                },
                {
                    name: "pluginName",
                    message: "Enter the plugin name:",
                    default: "myCustomPlugin",
                    validate: pluginName => {
                        if (!pluginName) {
                            return "Missing plugin name.";
                        }

                        const isValidName = pluginName === Case.camel(pluginName);
                        if (!isValidName) {
                            return `Please use camel case when providing the name of the plugin (for example "myCustomPlugin").`;
                        }

                        return true;
                    }
                },
                {
                    name: "packageName",
                    message: "Enter the package name:",
                    default: (answers: Input) => {
                        return Case.kebab(answers.pluginName);
                    },
                    validate: pkgName => {
                        if (!pkgName) {
                            return "Missing package name.";
                        }

                        const isValidName = validateNpmPackageName(pkgName);
                        if (!isValidName) {
                            return `Package name must look something like "my-custom-plugin".`;
                        }

                        return true;
                    }
                },
                {
                    name: "location",
                    message: `Enter the plugin location:`,
                    default: (answers: Input) => {
                        return `plugins/${answers.pluginName}`;
                    },
                    validate: location => {
                        if (!location) {
                            return "Please enter the package location.";
                        }

                        if (!location.startsWith("plugins/")) {
                            return 'Package location must start with "plugins/".';
                        }

                        const locationPath = path.resolve(location);
                        if (fs.existsSync(locationPath)) {
                            return `The target location already exists "${location}".`;
                        }

                        return true;
                    }
                }
            ];
        },
        generate: async ({ input, ora }) => {
            const { pluginType, pluginName, packageName, location } = input;

            try {
                ora.start(`Creating ${pluginName} plugin...`);

                const sourcePath = path.join(__dirname, "templates", pluginType);

                if (fs.existsSync(location)) {
                    throw new WebinyError(`The target location already exists "${location}"`);
                }

                const project = getProject();

                const baseTsConfigFullPath = path.resolve(project.root, "tsconfig.json");
                const baseTsConfigRelativePath = path.relative(location, baseTsConfigFullPath);

                fs.mkdirSync(location, { recursive: true });

                // Copy template files
                await ncp(sourcePath, location);

                const codeReplacements = [
                    { find: "PACKAGE_NAME", replaceWith: packageName },
                    {
                        find: "BASE_TSCONFIG_PATH",
                        replaceWith: baseTsConfigRelativePath
                    }
                ];

                replaceInPath(path.join(location, "**/*.*"), codeReplacements);

                // Add package to workspaces
                const rootPackageJsonPath = path.join(project.root, "package.json");
                const rootPackageJson = await readJson<PackageJson>(rootPackageJsonPath);
                if (!rootPackageJson.workspaces.packages.includes(location)) {
                    rootPackageJson.workspaces.packages.push(location);
                    await writeJson(rootPackageJsonPath, rootPackageJson);
                }

                if (typeof generators[pluginType] === "function") {
                    await generators[pluginType]({ input });
                }

                // Once everything is done, run `yarn` so the new packages are automatically installed.
                await execa("yarn");

                ora.succeed(`New plugin created in ${location}.`);
            } catch (err) {
                ora.fail("Could not create plugin. Please check the logs below.");
                console.log();
                console.log(err);
            }
        }
    }
});
