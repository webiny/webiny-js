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
        // toDto() returns a structuredClone, so we can safely mutate it in applyLicense.
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
    private applyLicense(
        baseFeatureFlagsDto: IFeatureFlagsDto,
        license: ILicense
    ): IFeatureFlagsDto {
        // multiTenancy.
        if (baseFeatureFlagsDto.multiTenancy !== false) {
            baseFeatureFlagsDto.multiTenancy = license.canUseFeature("multiTenancy")
                ? baseFeatureFlagsDto.multiTenancy
                : false;
        }

        // advancedPublishingWorkflow.
        if (baseFeatureFlagsDto.advancedPublishingWorkflow !== false) {
            baseFeatureFlagsDto.advancedPublishingWorkflow = license.canUseWorkflows()
                ? baseFeatureFlagsDto.advancedPublishingWorkflow
                : false;
        }

        // advancedAccessControlLayer.
        if (baseFeatureFlagsDto.advancedAccessControlLayer !== false) {
            if (!license.canUseAacl()) {
                // License doesn't allow AACL at all.
                baseFeatureFlagsDto.advancedAccessControlLayer = false;
            } else if (typeof baseFeatureFlagsDto.advancedAccessControlLayer === "object") {
                // License allows AACL; constrain sub-options.
                const aacl = baseFeatureFlagsDto.advancedAccessControlLayer as IAaclFeatureFlags;

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
            }
        }

        // auditLogs.
        if (baseFeatureFlagsDto.auditLogs !== false) {
            baseFeatureFlagsDto.auditLogs = license.canUseAuditLogs()
                ? baseFeatureFlagsDto.auditLogs
                : false;
        }

        // recordLocking.
        if (baseFeatureFlagsDto.recordLocking !== false) {
            baseFeatureFlagsDto.recordLocking = license.canUseRecordLocking()
                ? baseFeatureFlagsDto.recordLocking
                : false;
        }

        // fileManager — base is always allowed; only restrict threatDetection.
        if (
            baseFeatureFlagsDto.fileManager !== false &&
            typeof baseFeatureFlagsDto.fileManager === "object"
        ) {
            const fm = baseFeatureFlagsDto.fileManager as IFileManagerFeatureFlags;

            if (fm.threatDetection !== false) {
                fm.threatDetection = license.canUseFileManagerThreatDetection()
                    ? fm.threatDetection
                    : false;
            }
        }

        return baseFeatureFlagsDto;
    }
}

export const getFeatureFlagsWithLicense = GetFeatureFlags.createDecorator({
    decorator: GetFeatureFlagsWithLicenseDecorator,
    dependencies: []
});
