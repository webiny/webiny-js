import { FeatureFlags } from "../abstractions.js";
import { FeatureFlags as FeatureFlagsClass } from "@webiny/feature-flags";
import type { IFeatureFlagsDto, IAaclFeatureFlags } from "@webiny/feature-flags";
import type { ILicense } from "@webiny/wcp/types.js";
import { WcpContext } from "~/features/wcp/WcpContext/abstractions.js";

function applyLicenseFlag<T extends boolean | undefined>(
    userValue: T,
    licenseAllows: boolean
): T | false {
    return licenseAllows ? userValue : false;
}

class FeatureFlagsWithLicenseDecoratorImpl implements FeatureFlags.Interface {
    constructor(
        private wcp: WcpContext.Interface,
        private decoratee: FeatureFlags.Interface
    ) {}

    get(): FeatureFlagsClass {
        const base = this.decoratee.get();
        const license = this.wcp.getProjectLicense();
        const dto = this.applyLicense(base.toDto(), license);
        return FeatureFlagsClass.fromDto(dto);
    }

    private applyLicense(dto: IFeatureFlagsDto, license: ILicense): IFeatureFlagsDto {
        dto.multiTenancy = applyLicenseFlag(
            dto.multiTenancy,
            license.canUseFeature("multiTenancy")
        );

        dto.advancedPublishingWorkflow = applyLicenseFlag(
            dto.advancedPublishingWorkflow,
            license.canUseWorkflows()
        );

        if (dto.advancedAccessControlLayer !== false) {
            if (!license.canUseAacl()) {
                dto.advancedAccessControlLayer = false;
            } else if (typeof dto.advancedAccessControlLayer === "object") {
                const aacl = dto.advancedAccessControlLayer as IAaclFeatureFlags;
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

        dto.auditLogs = applyLicenseFlag(dto.auditLogs, license.canUseAuditLogs());
        dto.recordLocking = applyLicenseFlag(dto.recordLocking, license.canUseRecordLocking());
        dto.abTesting = applyLicenseFlag(dto.abTesting, license.canUseAbTesting());

        if (!dto.fileManager) {
            dto.fileManager = {};
        }
        dto.fileManager.threatDetection = applyLicenseFlag(
            dto.fileManager.threatDetection,
            license.canUseFileManagerThreatDetection()
        );

        return dto;
    }
}

export const FeatureFlagsWithLicenseDecorator = FeatureFlags.createDecorator({
    decorator: FeatureFlagsWithLicenseDecoratorImpl,
    dependencies: [WcpContext]
});
