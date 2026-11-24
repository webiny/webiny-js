import { ProjectInfoService } from "@webiny/project/abstractions/index.js";
import { GetPulumiVersionService } from "~/abstractions/services/GetPulumiVersionService.js";

/**
 * Adds the Pulumi section to `webiny about`: the installed Pulumi packages and how Pulumi secrets
 * are configured.
 */
export class ProjectInfoWithPulumi implements ProjectInfoService.Interface {
    constructor(
        private getPulumiVersion: GetPulumiVersionService.Interface,
        private decoratee: ProjectInfoService.Interface
    ) {}

    async execute() {
        const info = await this.decoratee.execute();
        const [pulumiVersion, pulumiAwsVersion] = this.getPulumiVersion.execute();

        return {
            ...info,
            sections: [
                ...info.sections,
                {
                    name: "Pulumi",
                    data: {
                        "@pulumi/pulumi": pulumiVersion,
                        "@pulumi/aws": pulumiAwsVersion,
                        "Secrets Provider": process.env.PULUMI_SECRETS_PROVIDER || "",
                        "Using Password": process.env.PULUMI_CONFIG_PASSPHRASE ? "Yes" : "No"
                    }
                }
            ]
        };
    }
}

export const projectInfoWithPulumi = ProjectInfoService.createDecorator({
    decorator: ProjectInfoWithPulumi,
    dependencies: [GetPulumiVersionService]
});
