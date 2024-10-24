import { QuestionCollection } from "inquirer";
import Case from "case";
import path from "path";
import fs from "node:fs";
import validateNpmPackageName from "validate-npm-package-name";

export const EXTENSIONS_ROOT_FOLDER = "extensions";

export interface Input {
    type: string;
    name: string;
    packageName: string;
    location: string;
    dependencies?: string;
    templateArgs?: string;
}

export const promptQuestions: QuestionCollection = [
    {
        name: "type",
        message: "What type of an extension do you want to create?",
        type: "list",
        choices: [
            { name: "Admin extension", value: "admin" },
            { name: "API extension", value: "api" },
            { name: "Page Builder element", value: "pbElement" },
            { name: "Website extension", value: "website" }
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
