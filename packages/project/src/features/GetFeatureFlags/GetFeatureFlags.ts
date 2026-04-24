import { createImplementation } from "@webiny/di";
import { FeatureFlags } from "@webiny/feature-flags";
import { GetFeatureFlags, GetProjectConfig } from "~/abstractions/index.js";
import { FeatureFlags as FeatureFlagsExtension } from "~/extensions/FeatureFlags.js";

class DefaultGetFeatureFlags implements GetFeatureFlags.Interface {
    constructor(private getProjectConfig: GetProjectConfig.Interface) {}

    async execute(): Promise<FeatureFlags> {
        const projectConfig = await this.getProjectConfig.execute({
            tags: { runtimeContext: "project" }
        });

        const extensions = projectConfig.extensionsByType(FeatureFlagsExtension);

        if (extensions.length === 0) {
            return new FeatureFlags({});
        }

        return FeatureFlags.fromDto(extensions[0].params.features);
    }
}

export const getFeatureFlags = createImplementation({
    abstraction: GetFeatureFlags,
    implementation: DefaultGetFeatureFlags,
    dependencies: [GetProjectConfig]
});
