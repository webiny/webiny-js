import { WcpFeatureOverrides as WcpFeatureOverridesAbstraction } from "./abstractions.js";
import { BuildParams } from "../../buildParams/abstractions.js";
import type { WcpFeatureFlags } from "@webiny/wcp/types.js";

class WcpFeatureFlags implements WcpFeatureOverridesAbstraction.Interface {
    constructor(private buildParams: BuildParams.Interface) {}

    isEnabled(featureName: string): boolean {
        const features = this.buildParams.get<WcpFeatureFlags>("Wcp/FeatureFlags");
        if (!features) {
            return true;
        }

        switch (featureName) {
            case "multiTenancy":
                return features.multiTenancy?.enabled !== false;
            case "workflows":
                return features.advancedPublishingWorkflow?.enabled !== false;
            case "aacl":
                return features.advancedAccessControlLayer?.enabled !== false;
            case "teams":
                return features.advancedAccessControlLayer?.options?.teams !== false;
            case "privateFiles":
                return features.advancedAccessControlLayer?.options?.privateFiles !== false;
            case "folderLevelPermissions":
                return features.advancedAccessControlLayer?.options?.folderLevelPermissions !==
                    false;
            case "auditLogs":
                return features.auditLogs?.enabled !== false;
            case "recordLocking":
                return features.recordLocking?.enabled !== false;
            case "fileManagerThreatDetection":
                return features.fileManager?.options?.threatDetection !== false;
            default:
                return true;
        }
    }
}

export const WcpFeatureOverrides = WcpFeatureOverridesAbstraction.createImplementation({
    implementation: WcpFeatureFlags,
    dependencies: [BuildParams]
});
