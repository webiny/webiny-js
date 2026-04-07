import execa from "execa";
import fs from "fs-extra";
import type { ListrTask } from "listr2";
import { Listr } from "listr2";
import path from "path";
import { rimrafSync } from "rimraf";
import chalk from "chalk";
import yesno from "yesno";
import { configureMcp } from "@webiny/mcp";
import type { IUi } from "@webiny/mcp";
import { SetupBaseWebinyProject } from "./CreateWebinyProject/projects/base/SetupBaseWebinyProject.js";
import { SetupAwsWebinyProject } from "./CreateWebinyProject/projects/aws/SetupAwsWebinyProject.js";
import {
    Analytics,
    EnsureNoGlobalWebinyCli,
    EnsureNoTargetFolder,
    EnsureNoYarnLockPackageJson,
    EnsureValidProjectName,
    GetProjectRootPath,
    InitGit,
    IsGitAvailable,
    PrintErrorInfo,
    PrintSystemInfo,
    SetupYarn,
    SetWebinyPackageVersions
} from "../services/index.js";
import { CliParams } from "../types.js";
import { AwsProjectParams } from "./CreateWebinyProject/projects/aws/types.js";
import ora from "ora";

const { green, bold, cyan, gray, yellow } = chalk;

/* Styled UI for MCP setup output — aligns visually with the rest of CWP output. */
class CwpUi implements IUi {
    info(text: string, ...args: any[]): void {
        console.log(gray(text), ...args);
    }

    success(text: string, ...args: any[]): void {
        console.log(`${green("✔")} ${text}`, ...args);
    }

    error(text: string, ...args: any[]): void {
        console.error(`${chalk.red("✘")} ${text}`, ...args);
    }

    warning(text: string, ...args: any[]): void {
        console.warn(`${yellow("⚠")} ${text}`, ...args);
    }

    text(text: string): void {
        console.log(text);
    }

    emptyLine(): void {
        console.log();
    }
}

export class CreateWebinyProject {
    async execute(cliArgs: CliParams) {
        const { projectName, debug, cleanup, log } = cliArgs;

        if (!projectName) {
            throw Error("You must provide a name for the project to use.");
        }

        const getProjectRootPath = new GetProjectRootPath();
        const projectRootPath = getProjectRootPath.execute(cliArgs);

        // All of these `ensureXyz` services will terminate the process if something is wrong.
        const ensureValidProjectName = new EnsureValidProjectName();
        ensureValidProjectName.execute(projectName);

        const ensureNoTargetFolder = new EnsureNoTargetFolder();
        ensureNoTargetFolder.execute(cliArgs);

        const ensureNoYarnLockPackageJson = new EnsureNoYarnLockPackageJson();
        await ensureNoYarnLockPackageJson.execute();

        const ensureNoGlobalWebinyCli = new EnsureNoGlobalWebinyCli();
        await ensureNoGlobalWebinyCli.execute();

        const isGitAvailable = new IsGitAvailable().execute();

        console.log(`Initializing a new Webiny project in ${green(projectRootPath)}...`);

        const analytics = new Analytics();
        await analytics.track("start");

        let awsProjectParams: AwsProjectParams = {
            region: "us-east-1",
            storageOps: "ddb",
            aiAgent: "other"
        };

        try {
            const taskItems: ListrTask[] = [
                {
                    // Creates root package.json.
                    title: "Prepare project folder",
                    task: () => fs.ensureDirSync(projectName)
                },
                {
                    title: "Setup Yarn",
                    task: async () => {
                        const setupYarn = new SetupYarn();
                        await setupYarn.execute(cliArgs);
                    }
                }
            ];

            if (isGitAvailable) {
                taskItems.push({
                    title: `Initialize git`,
                    task: (_, task) => {
                        const initGit = new InitGit();
                        try {
                            initGit.execute(cliArgs);
                        } catch {
                            task.skip("Git repo not initialized");
                        }
                    }
                });
            }

            const tasks = new Listr(taskItems);
            await tasks.run();

            console.log();

            const setupBaseWebinyProject = new SetupBaseWebinyProject();
            setupBaseWebinyProject.execute(cliArgs);

            const setupAwsWebinyProject = new SetupAwsWebinyProject();
            awsProjectParams = await setupAwsWebinyProject.execute(cliArgs);

            const setWebinyPackageVersions = new SetWebinyPackageVersions();
            await setWebinyPackageVersions.execute(cliArgs);

            // Install dependencies.
            console.log();
            const spinner = ora("Installing packages...").start();
            try {
                const subprocess = execa("yarn", [], {
                    cwd: projectRootPath,
                    maxBuffer: 500_000_000
                });
                await subprocess;
                spinner.succeed("Packages installed successfully.");
            } catch (e) {
                spinner.fail("Failed to install packages.");

                console.log(e.message);

                throw new Error(
                    "Failed while installing project dependencies. Please check the above Yarn logs for more information.",
                    { cause: e }
                );
            }

            // Configure MCP server for the selected AI agent.
            if (awsProjectParams.aiAgent !== "other") {
                console.log();
                console.log(
                    bold(`Configuring MCP server for ${cyan(awsProjectParams.aiAgent)}...`)
                );
                console.log();
                await configureMcp({
                    agent: awsProjectParams.aiAgent,
                    ui: new CwpUi(),
                    cwd: projectRootPath
                });
            }

            await analytics.track("end");
        } catch (err) {
            const stage = "error";
            // Commenting out for now, as we don't have any graceful errors implemented yet.
            // if (err instanceof GracefulError) {
            //     stage = "error-graceful";
            // }

            await analytics.track(stage, {
                errorMessage: err.cause?.message || err.message,
                errorStack: err.cause?.stack || err.stack
            });

            const printErrorInfo = new PrintErrorInfo();
            printErrorInfo.execute(err, cliArgs);

            const printSystemInfo = new PrintSystemInfo();
            printSystemInfo.execute(cliArgs);

            console.log(`Writing logs to ${green(path.resolve(log))}...`);
            fs.writeFileSync(path.resolve(log), err.toString());

            console.log();
            if (cleanup) {
                console.log("Deleting created files and folders...");
                rimrafSync(projectRootPath);
            } else {
                console.log("Project cleanup skipped.");
            }

            process.exit(1);
        }

        console.log();
        console.log(
            `🎉 Your new Webiny project ${green(
                projectName
            )} has been created and is ready to be deployed for the first time!`
        );
        console.log();

        const ok = await yesno({
            question: bold(`${green("?")} Would you like to deploy your project now (Y/n)?`),
            defaultValue: true
        });

        console.log();

        if (ok) {
            console.log("🚀 Deploying your new Webiny project...");
            console.log();

            try {
                const command = ["webiny", "deploy"];
                if (debug) {
                    command.push("--debug");
                }

                await execa("yarn", command, {
                    cwd: projectRootPath,
                    stdio: "inherit"
                });
            } catch {
                // Don't do anything. This is because the `webiny deploy` command has its own
                // error handling and will print the error message. As far as this setup script
                // is concerned, it succeeded, and it doesn't need to do anything else.
            }

            // For "other" agents, show manual MCP setup instructions after deploy has finished.
            if (awsProjectParams.aiAgent === "other") {
                await configureMcp({ instructions: true });
            }

            return;
        }

        // For "other" agents, show manual MCP setup instructions instead of blocking the deploy step.
        if (awsProjectParams.aiAgent === "other") {
            await configureMcp({ instructions: true });
        }

        console.log(
            [
                `Finish the setup by running the following command: ${green(
                    `cd ${projectName} && yarn webiny deploy`
                )}`,
                "",
                `To see all of the available CLI commands, run ${green(
                    "yarn webiny --help"
                )} in your ${green(projectName)} directory.`,
                "",
                "Want to dive deeper into Webiny? Check out https://webiny.com/docs/!",
                "Like the project? Star us on https://github.com/webiny/webiny-js!",
                "",
                "Need help? Join our Slack community! https://www.webiny.com/slack",
                "",
                "🚀 Happy coding!"
            ].join("\n")
        );
    }
}
