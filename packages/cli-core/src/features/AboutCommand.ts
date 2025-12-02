import { createImplementation } from "@webiny/di";
import { CliCommand, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import chalk from "chalk";

interface IAboutCommandParams {
    json?: boolean;
}

const NO_VALUE = "-";

export class AboutCommand implements CliCommand.Interface<IAboutCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    execute(): CliCommand.CommandDefinition<IAboutCommandParams> {
        return {
            name: "about",
            description: "Display information about the current Webiny project.",
            options: [
                {
                    name: "json",
                    description: "Emit output as JSON.",
                    type: "boolean",
                    default: false
                }
            ],
            handler: async (args: IAboutCommandParams) => {
                const projectSdk = await this.getProjectSdkService.execute();
                const data = await projectSdk.getProjectInfo();
                const ui = this.uiService;

                if (args.json) {
                    ui.text(JSON.stringify(data, null, 2));
                    return;
                }

                const { pulumi, host, wcp, webiny } = data;

                const sections = [
                    {
                        sectionName: "Webiny Project",
                        data: {
                            // Name: data.project.name,
                            Version: data.webiny.version,
                            // "Database Setup": getDatabaseSetupLabel(),
                            "Debug Enabled": webiny.debugEnabled ? "Yes" : "No"
                            // "Feature Flags": process.env.WEBINY_FEATURE_FLAGS
                        }
                    },
                    {
                        sectionName: "Webiny Control Panel (WCP)",
                        data: {
                            "Project ID": wcp.projectId,
                            // User: wcpUser?.email || NO_VALUE,
                            "Using Project Environment API Key": wcp.usingProjectEnvironmentApiKey
                                ? "Yes"
                                : "No"
                        }
                    },
                    {
                        sectionName: "Host",
                        data: {
                            OS: host.os,
                            "Node.js": host.nodeJs,
                            NPM: host.npm,
                            NPX: host.npx,
                            Yarn: host.yarn,
                            "Is CI": host.isCI ? "Yes" : "No"
                        }
                    },
                    {
                        sectionName: "Pulumi",
                        data: {
                            "@pulumi/pulumi": pulumi["@pulumi/pulumi"],
                            "@pulumi/aws": pulumi["@pulumi/aws"],
                            "Secrets Provider": pulumi.secretsProvider,
                            "Using Password": pulumi.usingPassword ? "Yes" : "No"
                        }
                    }
                ];

                sections.forEach(({ sectionName, data }, index) => {
                    ui.text(chalk.bold(sectionName));

                    for (const key of Object.keys(data) as Array<keyof typeof data>) {
                        ui.raw(key.padEnd(36));
                        ui.raw(data[key] || NO_VALUE);
                        ui.newLine();
                    }

                    const isLastSection = index === 3;
                    if (!isLastSection) {
                        ui.newLine();
                    }
                });
            }
        };
    }
}

export const aboutCommand = createImplementation({
    abstraction: CliCommand,
    implementation: AboutCommand,
    dependencies: [GetProjectSdkService, UiService]
});
