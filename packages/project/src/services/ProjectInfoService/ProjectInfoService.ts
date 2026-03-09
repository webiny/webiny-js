import { createImplementation } from "@webiny/di";
import {
    ProjectInfoService,
    GetIsCiService,
    GetNpmVersionService,
    GetNpxVersionService,
    GetPulumiVersionService,
    GetYarnVersionService,
    GetProjectVersionService
} from "~/abstractions/index.js";
import { IProjectInfoServiceResult } from "~/abstractions/services/ProjectInfoService/ProjectInfoService.js";

export class DefaultProjectInfoService implements ProjectInfoService.Interface {
    constructor(
        private getIsCi: GetIsCiService.Interface,
        private getNpmVersion: GetNpmVersionService.Interface,
        private getNpxVersion: GetNpxVersionService.Interface,
        private getPulumiVersion: GetPulumiVersionService.Interface,
        private getYarnVersion: GetYarnVersionService.Interface,
        private getProjectVersion: GetProjectVersionService.Interface
    ) {}

    async execute() {
        const wcpProjectId = process.env.WEBINY_PROJECT_ID || process.env.WCP_PROJECT_ID || "";
        // const wcpUser = await getUser().catch(() => null);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const wcpUsingProjectEnvironmentApiKey = Boolean(
            process.env.WEBINY_PROJECT_API_KEY ||
                process.env.WCP_PROJECT_ENVIRONMENT_API_KEY ||
                process.env.WCP_ENVIRONMENT_API_KEY
        );

        const isCI = this.getIsCi.execute();
        const npmVersion = this.getNpmVersion.execute();
        const npxVersion = this.getNpxVersion.execute();
        const yarnVersion = this.getYarnVersion.execute();
        const [pulumiVersion, pulumiAwsVersion] = this.getPulumiVersion.execute();

        return {
            webiny: {
                version: this.getProjectVersion.execute(),
                debugEnabled: process.env.DEBUG === "true",
                featureFlags: process.env.WEBINY_FEATURE_FLAGS || {}
            },
            wcp: {
                projectId: wcpProjectId,
                // user: wcpUser?.email || "N/A",
                usingProjectEnvironmentApiKey: false // wcpUsingProject
            },
            host: {
                os: `${process.platform} (${process.arch})`,
                nodeJs: process.version,
                npm: npmVersion,
                npx: npxVersion,
                yarn: yarnVersion,
                isCI: isCI
            },
            pulumi: {
                "@pulumi/pulumi": pulumiVersion,
                "@pulumi/aws": pulumiAwsVersion,
                secretsProvider: process.env.PULUMI_SECRETS_PROVIDER || "",
                usingPassword: !!process.env.PULUMI_CONFIG_PASSPHRASE
            }
        } as IProjectInfoServiceResult;
    }
}

export const projectInfoService = createImplementation({
    abstraction: ProjectInfoService,
    implementation: DefaultProjectInfoService,
    dependencies: [
        GetIsCiService,
        GetNpmVersionService,
        GetNpxVersionService,
        GetPulumiVersionService,
        GetYarnVersionService,
        GetProjectVersionService
    ]
});
