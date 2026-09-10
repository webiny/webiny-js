import { License } from "@webiny/wcp";
import type { ILicense, DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { FeatureFlags } from "@webiny/feature-flags";
import type { FeatureFlagName } from "@webiny/feature-flags";
import { GetFeatureFlags } from "~/abstractions/index.js";

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
    abTesting: l => l.canUseAbTesting()
};

class BuildLicenseDecoratedFeatureFlags extends FeatureFlags {
    constructor(
        private base: FeatureFlags,
        private license: ILicense
    ) {
        super(base.toDto());
    }

    override isEnabled(name: FeatureFlagName): boolean {
        const check = LICENSE_CHECKS[name];
        if (check) {
            if (!check(this.license)) {
                return false;
            }
            return !this.base.isExplicitlyDisabled(name);
        }
        if (!this.license.getRawLicense()) {
            return false;
        }
        return !this.base.isExplicitlyDisabled(name);
    }
}

class GetFeatureFlagsWithLicenseDecorator implements GetFeatureFlags.Interface {
    constructor(private decoratee: GetFeatureFlags.Interface) {}

    async execute(): Promise<FeatureFlags> {
        const userFlags = await this.decoratee.execute();
        const license = this.getLicenseFromEnv();
        return new BuildLicenseDecoratedFeatureFlags(userFlags, license);
    }

    private getLicenseFromEnv(): ILicense {
        const licenseEnv = process.env.WCP_PROJECT_LICENSE;
        if (!licenseEnv) {
            return License.fromLicenseDto(null);
        }

        try {
            const licenseDto = JSON.parse(licenseEnv) as DecryptedWcpProjectLicense;
            return License.fromLicenseDto(licenseDto);
        } catch {
            return License.fromLicenseDto(null);
        }
    }
}

export const getFeatureFlagsWithLicense = GetFeatureFlags.createDecorator({
    decorator: GetFeatureFlagsWithLicenseDecorator,
    dependencies: []
});
