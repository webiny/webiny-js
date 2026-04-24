import { createImplementation } from "@webiny/di";
import { GetProjectConfigService, GetPulumiResourceNamePrefix } from "~/abstractions/index.js";
import { PulumiResourceNamePrefix as PulumiResourceNamePrefixExt } from "~/extensions/pulumi/index.js";

export class DefaultGetPulumiResourceNamePrefix implements GetPulumiResourceNamePrefix.Interface {
    constructor(private getProjectConfigService: GetProjectConfigService.Interface) {}
    async execute() {
        const projectConfig = await this.getProjectConfigService.execute();

        let pulumiResourceNamePrefix = "wby-";
        const [pulumiResourceNamePrefixExt] = projectConfig.extensionsByType(
            PulumiResourceNamePrefixExt
        );

        if (pulumiResourceNamePrefixExt) {
            pulumiResourceNamePrefix = pulumiResourceNamePrefixExt.params.prefix;
        }

        return pulumiResourceNamePrefix;
    }
}

export const getPulumiResourceNamePrefix = createImplementation({
    abstraction: GetPulumiResourceNamePrefix,
    implementation: DefaultGetPulumiResourceNamePrefix,
    dependencies: [GetProjectConfigService]
});
