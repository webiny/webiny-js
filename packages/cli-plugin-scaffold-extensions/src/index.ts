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
    type: string;
    name: string;
    packageName: string;
    location: string;
    dependencies?: string;
}

const EXTENSIONS_ROOT_FOLDER = "extensions";

export default (): CliCommandScaffoldTemplate<Input> => ({
    name: "cli-plugin-scaffold-template-extensions",
    type: "cli-plugin-scaffold-template",
    templateName: "new-extension",
    scaffold: {
        name: "New Extension",
        description: "Scaffolds essential files for creating a new extension.",
        questions: () => {
            return [
                {
                    name: "type",
                    message: "What type of an extension do you want to create?",
                    type: "list",
                    choices: [
                        { name: "Admin extension", value: "admin" },
                        { name: "API extension", value: "api" }
                    ]
                },
                {
                    name: "name",
                    message: "Enter the extension name:",
                    default: "myCustomExtension",
                    validate: name => {
                        if (!name) {
                            return "Missing extension name.";
                        }

                        const isValidName = name === Case.camel(name);
                        if (!isValidName) {
                            return `Please use camel case when providing the name of the extension (for example "myCustomExtension").`;
                        }

                        return true;
                    }
                },
                {
                    name: "location",
                    message: `Enter the extension location:`,
                    default: (answers: Input) => {
                        return `${EXTENSIONS_ROOT_FOLDER}/${answers.name}`;
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
                },
                {
                    name: "packageName",
                    message: "Enter the package name:",
                    default: (answers: Input) => {
                        return Case.kebab(answers.name);
                    },
                    validate: pkgName => {
                        if (!pkgName) {
                            return "Missing package name.";
                        }

                        const isValidName = validateNpmPackageName(pkgName);
                        if (!isValidName) {
                            return `Package name must be a valid NPM package name, for example "my-custom-extension".`;
                        }

                        return true;
                    }
                }
            ];
        },
        generate: async ({ input, ora, context }) => {
            const { type, name } = input;
            if (!type) {
                throw new Error("Missing extension type.");
            }

            const templatePath = path.join(__dirname, "templates", type);
            const templateExists = fs.existsSync(templatePath);
            if (!templateExists) {
                throw new Error("Unknown extension type.");
            }

            if (!name) {
                throw new Error("Missing extension name.");
            }

            let { packageName, location } = input;
            if (!packageName) {
                packageName = Case.kebab(name);
            }

            if (!location) {
                location = `${EXTENSIONS_ROOT_FOLDER}/${name}`;
            }

            if (fs.existsSync(location)) {
                throw new WebinyError(`The target location already exists "${location}"`);
            }

            try {
                ora.start(`Creating ${log.success.hl(name)} extension...`);

                // Copy template files
                fs.mkdirSync(location, { recursive: true });
                await ncp(templatePath, location);

                const project = getProject();

                const baseTsConfigFullPath = path.resolve(project.root, "tsconfig.json");
                const baseTsConfigRelativePath = path.relative(location, baseTsConfigFullPath);

                const codeReplacements = [
                    { find: "PACKAGE_NAME", replaceWith: packageName },
                    {
                        find: "BASE_TSCONFIG_PATH",
                        replaceWith: baseTsConfigRelativePath
                    }
                ];

                replaceInPath(path.join(location, "**/*.*"), codeReplacements);

                if (input.dependencies) {
                    const packageJsonPath = path.join(location, "package.json");
                    const packageJson = await readJson<PackageJson>(packageJsonPath);
                    if (!packageJson.dependencies) {
                        packageJson.dependencies = {};
                    }

                    const packages = input.dependencies.split(",");
                    for (const packageName of packages) {
                        const isWebinyPackage = packageName.startsWith("@webiny/");
                        if (isWebinyPackage) {
                            packageJson.dependencies[packageName] = context.version;
                            continue;
                        }

                        try {
                            const { stdout } = await execa("npm", [
                                "view",
                                packageName,
                                "version",
                                "json"
                            ]);

                            packageJson.dependencies[packageName] = `^${stdout}`;
                        } catch (e) {
                            throw new Error(
                                `Could not find ${log.red.hl(
                                    packageName
                                )} NPM package. Please double-check the package name and try again.`,
                                { cause: e }
                            );
                        }
                    }

                    await writeJson(packageJsonPath, packageJson);
                }

                // Add package to workspaces
                const rootPackageJsonPath = path.join(project.root, "package.json");
                const rootPackageJson = await readJson<PackageJson>(rootPackageJsonPath);
                if (!rootPackageJson.workspaces.packages.includes(location)) {
                    rootPackageJson.workspaces.packages.push(location);
                    await writeJson(rootPackageJsonPath, rootPackageJson);
                }

                if (typeof generators[type] === "function") {
                    await generators[type]({ input: { name, packageName } });
                }

                // Sleep for 1 second before proceeding with yarn installation.
                await new Promise(resolve => {
                    setTimeout(resolve, 1000);
                });

                // Once everything is done, run `yarn` so the new packages are installed.
                await execa("yarn");

                ora.succeed(`New extension created in ${log.success.hl(location)}.`);
            } catch (err) {
                ora.fail("Could not create extension. Please check the logs below.");
                console.log();
                console.log(err);
            }
        }
    }
});
