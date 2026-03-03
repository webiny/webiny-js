import { License } from "@webiny/wcp";
import type { ILicense, DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { FeatureFlags } from "@webiny/feature-flags";
import type {
    IFeatureFlagsDto,
    IAaclFeatureFlags,
    IFileManagerFeatureFlags
} from "@webiny/feature-flags";
import { GetFeatureFlags } from "~/abstractions/index.js";

class GetFeatureFlagsWithLicenseDecorator implements GetFeatureFlags.Interface {
    constructor(private decoratee: GetFeatureFlags.Interface) {}

    async execute(): Promise<FeatureFlags> {
        const userFlags = await this.decoratee.execute();
        const license = this.getLicenseFromEnv();
        return FeatureFlags.fromDto(this.applyLicense(userFlags.toDto(), license));
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

    /* For each licensable flag: final = user_value && license_allows.
     * If the user disables a feature they have access to, we respect false.
     * If the user enables a feature the license doesn't allow, we force false.
     * fileManager (base) is always allowed; only threatDetection is restricted. */
    private applyLicense(dto: IFeatureFlagsDto, license: ILicense): IFeatureFlagsDto {
        const merged: IFeatureFlagsDto = { ...dto };

        // multiTenancy.
        if (merged.multiTenancy !== false) {
            merged.multiTenancy = license.canUseFeature("multiTenancy")
                ? merged.multiTenancy
                : false;
        }

        // advancedPublishingWorkflow.
        if (merged.advancedPublishingWorkflow !== false) {
            merged.advancedPublishingWorkflow = license.canUseWorkflows()
                ? merged.advancedPublishingWorkflow
                : false;
        }

        // advancedAccessControlLayer.
        if (merged.advancedAccessControlLayer !== false) {
            if (!license.canUseAacl()) {
                // License doesn't allow AACL at all.
                merged.advancedAccessControlLayer = false;
            } else if (typeof merged.advancedAccessControlLayer === "object") {
                // License allows AACL; constrain sub-options.
                const aacl: IAaclFeatureFlags = { ...merged.advancedAccessControlLayer };

                if (aacl.teams !== false) {
                    aacl.teams = license.canUseTeams() ? aacl.teams : false;
                }
                if (aacl.privateFiles !== false) {
                    aacl.privateFiles = license.canUsePrivateFiles() ? aacl.privateFiles : false;
                }
                if (aacl.folderLevelPermissions !== false) {
                    aacl.folderLevelPermissions = license.canUseFolderLevelPermissions()
                        ? aacl.folderLevelPermissions
                        : false;
                }

                merged.advancedAccessControlLayer = aacl;
            }
        }

        // auditLogs.
        if (merged.auditLogs !== false) {
            merged.auditLogs = license.canUseAuditLogs() ? merged.auditLogs : false;
        }

        // recordLocking.
        if (merged.recordLocking !== false) {
            merged.recordLocking = license.canUseRecordLocking() ? merged.recordLocking : false;
        }

        // fileManager — base is always allowed; only restrict threatDetection.
        if (merged.fileManager !== false && typeof merged.fileManager === "object") {
            const fm: IFileManagerFeatureFlags = { ...merged.fileManager };

            if (fm.threatDetection !== false) {
                fm.threatDetection = license.canUseFileManagerThreatDetection()
                    ? fm.threatDetection
                    : false;
            }

            merged.fileManager = fm;
        }

        return merged;
    }
}

export const getFeatureFlagsWithLicense = GetFeatureFlags.createDecorator({
    decorator: GetFeatureFlagsWithLicenseDecorator,
    dependencies: []
});
