import { FeatureFlags } from "@webiny/feature-flags";
import type { IFeatureFlagsDto, FeatureFlagName } from "@webiny/feature-flags";
import type { WcpProjectLicenseContextValue } from "./WcpProjectLicenseContext.js";

const LICENSE_CHECKS: Record<string, (license: WcpProjectLicenseContextValue) => boolean> = {
    multiTenancy: l => l.canUseMultiTenancy(),
    advancedPublishingWorkflow: l => l.canUseWorkflows(),
    "advancedAccessControlLayer.teams": l => l.canUseTeams(),
    "advancedAccessControlLayer.privateFiles": l => l.canUsePrivateFiles(),
    "fileManager.threatDetection": l => l.canUseFileManagerThreatDetection(),
    "advancedAccessControlLayer.hcmsFieldPermissions": l => l.canUseHcmsFieldPermissions()
};

export class LicenseDecoratedFeatureFlags extends FeatureFlags {
    private readonly license: WcpProjectLicenseContextValue;

    constructor(dto: IFeatureFlagsDto, license: WcpProjectLicenseContextValue) {
        super(dto);
        this.license = license;
    }

    override isEnabled(name: FeatureFlagName): boolean {
        const check = LICENSE_CHECKS[name];
        if (check) {
            if (!check(this.license)) {
                return false;
            }
            return !super.isExplicitlyDisabled(name);
        }
        if (!this.license.hasLicense) {
            return false;
        }
        return !super.isExplicitlyDisabled(name);
    }
}
