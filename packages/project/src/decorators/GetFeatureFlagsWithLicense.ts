import { License } from "@webiny/wcp";
import type { ILicense, DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { FeatureFlags } from "@webiny/feature-flags";
import type { IFeatureFlagsDto, IAaclFeatureFlags } from "@webiny/feature-flags";
import { GetFeatureFlags } from "~/abstractions/index.js";

/* Returns the user's value when the license permits it, otherwise false.
 * This preserves an explicit user false (opt-out), while blocking features
 * the license doesn't cover. */
function applyLicenseFlag<T extends boolean | undefined>(
    userValue: T,
    licenseAllows: boolean
): T | false {
    return licenseAllows ? userValue : false;
}

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
    private applyLicense(featureFlagsDto: IFeatureFlagsDto, license: ILicense): IFeatureFlagsDto {
        featureFlagsDto.multiTenancy = applyLicenseFlag(
            featureFlagsDto.multiTenancy,
            license.canUseFeature("multiTenancy")
        );

        featureFlagsDto.advancedPublishingWorkflow = applyLicenseFlag(
            featureFlagsDto.advancedPublishingWorkflow,
            license.canUseWorkflows()
        );

        // advancedAccessControlLayer.
        if (featureFlagsDto.advancedAccessControlLayer !== false) {
            if (!license.canUseAacl()) {
                // License doesn't allow AACL at all.
                featureFlagsDto.advancedAccessControlLayer = false;
            } else if (typeof featureFlagsDto.advancedAccessControlLayer === "object") {
                // License allows AACL; constrain sub-options.
                const aacl = featureFlagsDto.advancedAccessControlLayer as IAaclFeatureFlags;
                aacl.teams = applyLicenseFlag(aacl.teams, license.canUseTeams());
                aacl.privateFiles = applyLicenseFlag(
                    aacl.privateFiles,
                    license.canUsePrivateFiles()
                );
                aacl.folderLevelPermissions = applyLicenseFlag(
                    aacl.folderLevelPermissions,
                    license.canUseFolderLevelPermissions()
                );
            }
        }

        featureFlagsDto.auditLogs = applyLicenseFlag(
            featureFlagsDto.auditLogs,
            license.canUseAuditLogs()
        );
        featureFlagsDto.recordLocking = applyLicenseFlag(
            featureFlagsDto.recordLocking,
            license.canUseRecordLocking()
        );

        // fileManager is always enabled; only restrict threatDetection via license.
        if (!featureFlagsDto.fileManager) {
            featureFlagsDto.fileManager = {};
        }
        featureFlagsDto.fileManager.threatDetection = applyLicenseFlag(
            featureFlagsDto.fileManager.threatDetection,
            license.canUseFileManagerThreatDetection()
        );

        return featureFlagsDto;
    }
}

export const getFeatureFlagsWithLicense = GetFeatureFlags.createDecorator({
    decorator: GetFeatureFlagsWithLicenseDecorator,
    dependencies: []
});
