import { CliCommandScaffoldTemplate } from "@webiny/cli-plugin-scaffold/types";
import fs from "fs";
import path from "path";
import util from "util";
import ncpBase from "ncp";
import Case from "case";
import readJson from "load-json-file";
import writeJson from "write-json-file";
import { replaceInPath } from "replace-in-path";
import chalk from "chalk";
import link from "terminal-link";
import { formatCode, addWorkspaceToRootPackageJson } from "@webiny/cli-plugin-scaffold/utils";
import execa from "execa";
import Error from "@webiny/error";

import { TsConfigJson } from "@webiny/cli-plugin-scaffold/types";

const ncp = util.promisify(ncpBase.ncp);

interface Input {
    name: string;
    description: string;
    path: string;
    showConfirmation?: boolean;
}

const SCAFFOLD_DOCS_LINK =
    "https://www.webiny.com/docs/how-to-guides/webiny-cli/scaffolding/react-application";

export default (): CliCommandScaffoldTemplate<Input> => ({
    name: "cli-plugin-scaffold-template-react-app",
    type: "cli-plugin-scaffold-template",
    scaffold: {
        name: "React Application",
        description:
            "Creates a new React application, inside of a new project application." +
            (link.isSupported ? " " + link("Learn more.", SCAFFOLD_DOCS_LINK) : ""),
        questions: () => {
            return [
                {
                    name: "name",
                    message: "Enter application name:",
                    default: `My New React Application`,
                    validate: name => {
                        if (name.length < 2) {
                            return `Please enter a name for your new React application.`;
                        }

                        return true;
                    }
                },
                {
                    name: "description",
                    message: "Enter application description:",
                    default: input => {
                        return `This is the ${input.name} React application.`;
                    },
                    validate: description => {
                        if (description.length < 2) {
                            return `Please enter a short description for your new React application.`;
                        }

                        return true;
                    }
                },
                {
                    name: "path",
                    message: "Enter application path:",
                    default: input => {
                        return Case.kebab(input.name);
                    },
                    validate: appPath => {
                        if (!appPath || appPath.length < 2) {
                            return `Please enter a valid path in which the new React application will be created.`;
                        }

                        const locationPath = path.resolve(appPath);
                        if (fs.existsSync(locationPath)) {
                            return `Cannot continue - the ${chalk.red(
                                appPath
                            )} folder already exists.`;
                        }

                        return true;
                    }
                }
            ];
        },
        generate: async options => {
            const { input, context, inquirer, wait, ora } = options;

            const templateFolderPath = path.join(__dirname, "template");

            if (input.showConfirmation !== false) {
                console.log();
                console.log(
                    `${chalk.bold("The following operations will be performed on your behalf:")}`
                );

                console.log(
                    `- a new React application will be created in ${chalk.green(input.path)}`
                );
                console.log(
                    `- the list of workspaces will be updated in the root ${chalk.green(
                        "package.json"
                    )} file`
                );

                const prompt = inquirer.createPromptModule();

                const { proceed } = await prompt({
                    name: "proceed",
                    message: `Are you sure you want to continue?`,
                    type: "confirm",
                    default: false
                });

                if (!proceed) {
                    process.exit(0);
                }
            }

            console.log();

            ora.start(`Creating a new React application in ${chalk.green(input.path)}...`);
            await wait(1000);

            fs.mkdirSync(input.path, { recursive: true });

            await ncp(templateFolderPath, input.path);

            const replacements = [
                { find: "Project application name", replaceWith: input.name },
                { find: "project-application-name", replaceWith: Case.kebab(input.name) },
                { find: "projectApplicationName", replaceWith: Case.camel(input.name) },
                { find: "Project application description", replaceWith: input.description },
                {
                    find: "project-application-path",
                    replaceWith: Case.kebab(input.path)
                }
            ];

            replaceInPath(path.join(input.path, "/**/*.*"), replacements);

            const tsConfigJsonPath = path.join(input.path, "code", "tsconfig.json");
            const tsConfigJson = await readJson<TsConfigJson>(tsConfigJsonPath);
            tsConfigJson.extends = path.join(
                path.relative(path.join(input.path, "code"), context.project.root),
                "tsconfig.json"
            );
            await writeJson(tsConfigJsonPath, tsConfigJson);

            {
                // Set correct `@webiny/*` package versions in the package.json file.
                const p = path.join(input.path, "code", "package.json");
                const replacements = [
                    {
                        find: "WEBINY_VERSION",
                        replaceWith: context.version
                    }
                ];
                replaceInPath(p, replacements);
            }

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `New React Application created in ${chalk.green(input.path)}.`
            });

            ora.start(
                `Updating the list of workspaces in the root ${chalk.green("package.json")} file...`
            );
            await wait(1000);

            // Add package to workspaces.
            const rootPackageJsonPath = path.join(context.project.root, "package.json");
            const pathToAdd = `${input.path}/code`;
            await addWorkspaceToRootPackageJson(rootPackageJsonPath, pathToAdd);

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `The list of workspaces in the root ${chalk.green(
                    "package.json"
                )} file updated.`
            });

            ora.start(`Finalizing...`);

            // Once everything is done, run `yarn` so the new packages are automatically installed.
            try {
                await execa("yarn");
                await execa("yarn", ["postinstall"]);
            } catch (err) {
                throw new Error(
                    `Unable to install dependencies. Try running "yarn" in project root manually.`,
                    err.message
                );
            }

            await formatCode(["**/*.ts", "**/*.tsx"], { cwd: input.path });

            ora.stopAndPersist({
                symbol: chalk.green("✔"),
                text: `Finalized.`
            });
        },
        onSuccess: async ({ input }) => {
            console.log();
            console.log(`${chalk.green("✔")} New React application created successfully.`);
            console.log();
            console.log(chalk.bold("Next Steps"));

            console.log(
                `‣ start the React application locally and continue development by running ${chalk.green(
                    `yarn webiny watch ${input.path} --env dev`
                )}`
            );

            console.log();
            console.log(chalk.bold("Useful Links"));

            const links = [
                ["React Application Scaffold", SCAFFOLD_DOCS_LINK],
                [
                    "Create Custom Application Tutorial",
                    "https://www.webiny.com/docs/tutorials/create-custom-application/introduction"
                ],
                [
                    "Use the Watch Command",
                    "https://www.webiny.com/docs/how-to-guides/webiny-cli/use-watch-command"
                ]
            ];

            links.forEach(([text, url]) =>
                console.log(
                    link("‣ " + text, url, { fallback: (text, link) => text + " - " + link })
                )
            );
        }
    }
});
