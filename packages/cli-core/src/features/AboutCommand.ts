import { createImplementation } from "@webiny/di";
import { CliCommandFactory, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import chalk from "chalk";

interface IAboutCommandParams {
    json?: boolean;
}

const NO_VALUE = "-";

export class AboutCommand implements CliCommandFactory.Interface<IAboutCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    execute(): CliCommandFactory.CommandDefinition<IAboutCommandParams> {
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

                const { host, wcp, webiny } = data;

                const sections: Array<{ sectionName: string; data: Record<string, string> }> = [
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
                    ...data.sections.map(section => ({
                        sectionName: section.name,
                        data: section.data
                    }))
                ];

                sections.forEach(({ sectionName, data }, index) => {
                    ui.text(chalk.bold(sectionName));

                    for (const key of Object.keys(data)) {
                        ui.raw(key.padEnd(36));
                        ui.raw(data[key] || NO_VALUE);
                        ui.emptyLine();
                    }

                    const isLastSection = index === sections.length - 1;
                    if (!isLastSection) {
                        ui.emptyLine();
                    }
                });
            }
        };
    }
}

export const aboutCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: AboutCommand,
    dependencies: [GetProjectSdkService, UiService]
});
