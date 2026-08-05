import { FeatureFlags } from "../abstractions.js";
import { FeatureFlags as FeatureFlagsClass } from "@webiny/feature-flags";
import type { FeatureFlagName } from "@webiny/feature-flags";
import type { ILicense } from "@webiny/wcp/types.js";
import { WcpLicenseProvider } from "~/features/wcp/WcpLicenseProvider.js";

const LICENSE_CHECKS: Record<string, (license: ILicense) => boolean> = {
    multiTenancy: l => l.canUseFeature("multiTenancy"),
    advancedPublishingWorkflow: l => l.canUseWorkflows(),
    advancedAccessControlLayer: l => l.canUseAacl(),
    "advancedAccessControlLayer.teams": l => l.canUseTeams(),
    "advancedAccessControlLayer.privateFiles": l => l.canUsePrivateFiles(),
    "advancedAccessControlLayer.folderLevelPermissions": l => l.canUseFolderLevelPermissions(),
    "advancedAccessControlLayer.hcmsFieldPermissions": l => l.canUseHcmsFieldPermissions(),
    auditLogs: l => l.canUseAuditLogs(),
    recordLocking: l => l.canUseRecordLocking(),
    "fileManager.threatDetection": l => l.canUseFileManagerThreatDetection(),
    abTesting: l => l.canUseAbTesting(),
    remoteComponents: l => l.canUseRemoteComponents()
};

class LicenseDecoratedFeatureFlags extends FeatureFlagsClass {
    constructor(
        private base: FeatureFlagsClass,
        private license: ILicense
    ) {
        super(base.toDto());
    }

    override isEnabled(name: FeatureFlagName): boolean {
        const check = LICENSE_CHECKS[name];
        if (check) {
            return this.base.isEnabled(name) && check(this.license);
        }
        return this.base.isEnabled(name);
    }
}

class FeatureFlagsWithLicenseDecoratorImpl implements FeatureFlags.Interface {
    constructor(
        private licenseProvider: WcpLicenseProvider.Interface,
        private decoratee: FeatureFlags.Interface
    ) {}

    get(): FeatureFlagsClass {
        const base = this.decoratee.get();
        return new LicenseDecoratedFeatureFlags(base, this.licenseProvider.get());
    }
}

export const FeatureFlagsWithLicenseDecorator = FeatureFlags.createDecorator({
    decorator: FeatureFlagsWithLicenseDecoratorImpl,
    dependencies: [WcpLicenseProvider]
});
