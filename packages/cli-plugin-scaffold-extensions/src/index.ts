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
import { getProject, log } from "@webiny/cli/utils";
import { generators } from "./generators";

const ncp = util.promisify(ncpBase.ncp);

interface Input {
    extensionName: string;
    packageName: string;
    location: string;
    pluginType: string;
}

const EXTENSIONS_ROOT_FOLDER = 'extensions';

export default (): CliCommandScaffoldTemplate<Input> => ({
    name: "cli-plugin-scaffold-template-plugin",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "New Extension",
        description: "Scaffolds essential files for creating a new extension.",
        questions: () => {
            return [
                {
                    name: "pluginType",
                    message: "What type of an extension do you want to create?",
                    type: "list",
                    choices: [
                        { name: "Admin extension", value: "admin" },
                        { name: "API extension", value: "api" }
                    ]
                },
                {
                    name: "extensionName",
                    message: "Enter the extension name:",
                    default: "myCustomPlugin",
                    validate: extensionName => {
                        if (!extensionName) {
                            return "Missing extension name.";
                        }

                        const isValidName = extensionName === Case.camel(extensionName);
                        if (!isValidName) {
                            return `Please use camel case when providing the name of the extension (for example "myCustomPlugin").`;
                        }

                        return true;
                    }
                },
                {
                    name: "packageName",
                    message: "Enter the package name:",
                    default: (answers: Input) => {
                        return Case.kebab(answers.extensionName);
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
                        return `${EXTENSIONS_ROOT_FOLDER}/${answers.extensionName}`;
                    },
                    validate: location => {
                        if (!location) {
                            return "Please enter the package location.";
                        }

                        if (!location.startsWith(`${EXTENSIONS_ROOT_FOLDER}/`)) {
                            return `Package location must start with "${EXTENSIONS_ROOT_FOLDER}/".`;
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
            const { pluginType, extensionName, packageName, location } = input;

            try {
                ora.start(`Creating ${extensionName} plugin...`);

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

                ora.succeed(`New plugin created in ${log.success.hl(location)}.`);
            } catch (err) {
                ora.fail("Could not create plugin. Please check the logs below.");
                console.log();
                console.log(err);
            }
        }
    }
});
