import { createImplementation } from "@webiny/di";
import { setTimeout } from "node:timers/promises";
import open from "open";
import ora from "ora";
import {
    CliCommandFactory,
    GetProjectSdkService,
    StdioService,
    UiService
} from "@webiny/cli-core/abstractions/index.js";
import { BuildRunner } from "@webiny/cli-core/features/BuildCommand/buildRunners/BuildRunner.js";
import { createBaseAppOptions } from "@webiny/cli-core/features/common/index.js";
import { DeployOutput } from "./deployOutputs/DeployOutput.js";
import {
    IDeployCommandParams,
    IDeploySingleAppParams
} from "@webiny/cli-core/features/DeployCommand/index.js";

// TODO: convert to a real service.
import { PrintInfoForEnv } from "@webiny/cli-core/features/InfoCommand/PrintInfoForEnv.js";

export type { IDeployCommandParams, IDeploySingleAppParams };

const sleep = (ms: number = 1500) => setTimeout(ms);

export class DeployCommand implements CliCommandFactory.Interface<IDeployCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface,
        private stdioService: StdioService.Interface
    ) {}

    async execute(): Promise<CliCommandFactory.CommandDefinition<IDeployCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();
        const ui = this.uiService;

        return {
            name: "deploy",
            description: "Deploys specified app or all apps in the project",
            examples: [
                "$0 deploy api --env dev",
                "$0 deploy core api --env dev",
                "$0 deploy admin --env prod",
                "$0 deploy --env prod",
                "$0 deploy"
            ],
            params: [
                {
                    name: "apps",
                    description:
                        "Name of the app(s) to deploy (core, admin, or api). You can specify multiple apps.",
                    type: "string",
                    array: true
                }
            ],
            options: [
                ...createBaseAppOptions(projectSdk),
                {
                    name: "build",
                    description: "Build packages before deploying",
                    type: "boolean",
                    default: true
                },
                {
                    name: "preview",
                    description: "Preview the deploy instead of actually performing it",
                    type: "boolean",
                    default: false
                },
                {
                    name: "show-deployment-logs",
                    description: "Print deployment logs (automatically enabled in CI environments)",
                    type: "boolean",
                    default: false
                },
                {
                    name: "allow-local-state-files",
                    description:
                        "Allow using local Pulumi state files with production environment deployment (not recommended).",
                    type: "boolean"
                }
            ],
            handler: async (params: IDeployCommandParams) => {
                if (params.apps && params.apps.length > 0) {
                    for (const appName of params.apps) {
                        const appParams: IDeploySingleAppParams = {
                            ...params,
                            app: appName
                        };

                        const app = await projectSdk.getApp(appName);
                        ui.info("Deploying %s app...", app.getDisplayName());
                        await this.deployApp(appParams);
                        ui.emptyLine();
                    }
                } else {
                    ui.info(`You're using Webiny v${projectSdk.getProjectVersion()}`);
                    ui.emptyLine();

                    const isCi = projectSdk.isCi();
                    const coreStack = await projectSdk.getAppStackOutput("core");

                    const isFirstDeployment = !isCi && !coreStack?.deploymentId;
                    if (isFirstDeployment) {
                        ui.info(`Looks like this is your first time deploying the project.`);
                        ui.info(
                            `Note that the initial deployment can take up to %s, so please be patient.`,
                            "10 minutes"
                        );
                        await sleep();
                    }

                    isFirstDeployment && ui.emptyLine();

                    ui.info("Deploying %s app...", "Core");
                    await this.deployApp({ ...params, app: "core" });
                    ui.emptyLine();

                    ui.info("Deploying %s app...", "API");
                    await this.deployApp({ ...params, app: "api" });
                    ui.emptyLine();
                    ui.info("Deploying %s app...", "Admin");
                    await this.deployApp({ ...params, app: "admin" });

                    if (isFirstDeployment) {
                        ui.success(`Congratulations! You've just deployed a brand new project!`);
                    } else {
                        ui.success(`Project deployed.`);
                    }

                    const printInfoForEnv = new PrintInfoForEnv({
                        getProjectSdkService: this.getProjectSdkService,
                        uiService: this.uiService
                    });

                    ui.emptyLine();
                    ui.textBold("Project Details");
                    await printInfoForEnv.execute(params);

                    const adminAppOutput = await projectSdk.getAppStackOutput("admin");

                    if (isFirstDeployment && adminAppOutput) {
                        ui.emptyLine();
                        ui.info(
                            "The final step is to open the %s app in your browser and complete the installation wizard.",
                            "Admin"
                        );

                        const spinner = ora(`Opening Admin in your browser...`).start();

                        try {
                            await sleep(7000);
                            open(adminAppOutput.appUrl as string);
                            spinner.succeed(`Successfully opened Admin app in your browser.`);
                        } catch {
                            spinner.fail(`Failed to open Admin in your browser.`);

                            await sleep(1000);
                            ui.emptyLine();
                            ui.warning(
                                `Failed to open %s app in your browser. To finish the setup and start using the project, please visit %s and complete the installation wizard.`,
                                "Admin",
                                adminAppOutput.appUrl
                            );
                        }
                    }
                }
            }
        };
    }

    private async deployApp(params: IDeploySingleAppParams) {
        const projectSdk = await this.getProjectSdkService.execute();

        const ui = this.uiService;
        const stdio = this.stdioService;

        if (params.build !== false) {
            const packagesBuilder = await projectSdk.buildApp(params);

            const buildRunner = new BuildRunner({
                stdio,
                ui,
                packagesBuilder
            });

            if (!buildRunner.isEmpty()) {
                await buildRunner.run();
                ui.emptyLine();
            }
        }

        const showDeploymentLogs = Boolean(
            projectSdk.isCi() || params.preview || params.showDeploymentLogs
        );

        return await projectSdk.deployApp({
            ...params,
            output: pulumiProcess => {
                const deployOutput = new DeployOutput({
                    stdio,
                    ui,
                    showDeploymentLogs,
                    deployProcess: pulumiProcess,
                    deployParams: params
                });

                return deployOutput.output();
            }
        });
    }
}

export const deployCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: DeployCommand,
    dependencies: [GetProjectSdkService, UiService, StdioService]
});
