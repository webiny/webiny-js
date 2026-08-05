import { FeatureFlags } from "@webiny/feature-flags";
import type { IFeatureFlagsDto } from "@webiny/feature-flags";
import type { WcpProjectLicenseContextValue } from "./WcpProjectLicenseContext.js";

export class LicenseDecoratedFeatureFlags extends FeatureFlags {
    private readonly license: WcpProjectLicenseContextValue;

    constructor(dto: IFeatureFlagsDto, license: WcpProjectLicenseContextValue) {
        super(dto);
        this.license = license;
    }

    override isMultiTenancyEnabled(): boolean {
        return super.isMultiTenancyEnabled() && this.license.canUseMultiTenancy();
    }

    override isWorkflowsEnabled(): boolean {
        return super.isWorkflowsEnabled() && this.license.canUseWorkflows();
    }

    override isTeamsEnabled(): boolean {
        return super.isTeamsEnabled() && this.license.canUseTeams();
    }

    override isPrivateFilesEnabled(): boolean {
        return super.isPrivateFilesEnabled() && this.license.canUsePrivateFiles();
    }

    override isFileManagerThreatDetectionEnabled(): boolean {
        return (
            super.isFileManagerThreatDetectionEnabled() &&
            this.license.canUseFileManagerThreatDetection()
        );
    }

    override isHcmsFieldPermissionsEnabled(): boolean {
        return super.isHcmsFieldPermissionsEnabled() && this.license.canUseHcmsFieldPermissions();
    }
}
