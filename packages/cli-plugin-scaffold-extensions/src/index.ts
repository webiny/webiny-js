import { CliCommandScaffoldTemplate } from "@webiny/cli-plugin-scaffold/types";
import path from "path";
import Case from "case";
import validateNpmPackageName from "validate-npm-package-name";
import fs from "node:fs";

import { downloadAndLinkExtension } from "./downloadAndLinkExtension";
import { generateExtension } from "./generateExtension";
import { Input } from "./types";

const EXTENSIONS_ROOT_FOLDER = "extensions";

export default () => [
    {
        type: "cli-command",
        name: "cli-command-link-extensions",
        // @ts-ignore This plugin doesn't have a type
        create({ yargs }) {
            yargs.command(["link-extensions"], `Link all project extensions.`, async () => {
                await import(__dirname + "/generators/utils/linkAllExtensions.js").then(m =>
                    m.linkAllExtensions()
                );

                process.exit(0);
            });
        }
    },
    {
        name: "cli-plugin-scaffold-template-extensions",
        type: "cli-plugin-scaffold-template",
        templateName: "extension",
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
                    },
                    {
                        name: "dependencies",
                        message: "Enter one or more NPM dependencies (optional):",
                        required: false
                    }
                ];
            },
            generate: async params => {
                // The `templateArgs` is used by this scaffold to identify if the user wants
                // to download an extension from the Webiny examples repository.
                const downloadExtensionSource = params.input.templateArgs;
                if (downloadExtensionSource) {
                    return downloadAndLinkExtension(params);
                }

                return generateExtension(params);
            }
        }
    } as CliCommandScaffoldTemplate<Input>
];
