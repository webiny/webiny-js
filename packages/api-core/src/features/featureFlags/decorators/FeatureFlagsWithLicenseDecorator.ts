import { FeatureFlags } from "../abstractions.js";
import { FeatureFlags as FeatureFlagsClass } from "@webiny/feature-flags";
import type { ILicense } from "@webiny/wcp/types.js";
import { WcpLicenseProvider } from "~/features/wcp/WcpLicenseProvider.js";

class LicenseDecoratedFeatureFlags extends FeatureFlagsClass {
    constructor(
        private base: FeatureFlagsClass,
        private license: ILicense
    ) {
        super(base.toDto());
    }

    override isMultiTenancyEnabled() {
        return this.base.isMultiTenancyEnabled() && this.license.canUseFeature("multiTenancy");
    }
    override isWorkflowsEnabled() {
        return this.base.isWorkflowsEnabled() && this.license.canUseWorkflows();
    }
    override isAaclEnabled() {
        return this.base.isAaclEnabled() && this.license.canUseAacl();
    }
    override isTeamsEnabled() {
        return this.base.isTeamsEnabled() && this.license.canUseTeams();
    }
    override isPrivateFilesEnabled() {
        return this.base.isPrivateFilesEnabled() && this.license.canUsePrivateFiles();
    }
    override isFolderLevelPermissionsEnabled() {
        return (
            this.base.isFolderLevelPermissionsEnabled() &&
            this.license.canUseFolderLevelPermissions()
        );
    }
    override isHcmsFieldPermissionsEnabled() {
        return (
            this.base.isHcmsFieldPermissionsEnabled() && this.license.canUseHcmsFieldPermissions()
        );
    }
    override isAuditLogsEnabled() {
        return this.base.isAuditLogsEnabled() && this.license.canUseAuditLogs();
    }
    override isRecordLockingEnabled() {
        return this.base.isRecordLockingEnabled() && this.license.canUseRecordLocking();
    }
    override isFileManagerThreatDetectionEnabled() {
        return (
            this.base.isFileManagerThreatDetectionEnabled() &&
            this.license.canUseFileManagerThreatDetection()
        );
    }
    override isAbTestingEnabled() {
        return this.base.isAbTestingEnabled() && this.license.canUseAbTesting();
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
