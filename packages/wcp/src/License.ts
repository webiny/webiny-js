import { getWcpProjectEnvironment } from "~/getWcpProjectEnvironment.js";
import type { DecryptedWcpProjectLicense, ILicense, WcpProject } from "~/types.js";
import { getWcpProjectLicense } from "~/licenses.js";
import { NullLicense } from "~/NullLicense.js";
import type { WCP_FEATURE_LABEL } from "~/index.js";

export class License implements ILicense {
    private readonly license: DecryptedWcpProjectLicense;

    static fromLicenseDto(license: DecryptedWcpProjectLicense | null) {
        if (!license) {
            return new NullLicense();
        }

        return new License(license);
    }

    static async fromEnvironment() {
        const wcpProjectEnvironment = getWcpProjectEnvironment();

        if (!wcpProjectEnvironment) {
            return new NullLicense();
        }

        const license = await getWcpProjectLicense({
            orgId: wcpProjectEnvironment.org.id,
            projectId: wcpProjectEnvironment.project.id,
            projectEnvironmentApiKey: wcpProjectEnvironment.apiKey
        });

        return License.fromLicenseDto(license);
    }

    private constructor(license: DecryptedWcpProjectLicense) {
        this.license = license;
    }

    getRawLicense(): DecryptedWcpProjectLicense {
        return this.license;
    }

    getProject(): WcpProject | null {
        return {
            orgId: this.license.orgId,
            projectId: this.license.projectId
        };
    }

    canUseFeature(wcpFeatureId: keyof typeof WCP_FEATURE_LABEL) {
        return this.license.package?.features?.[wcpFeatureId]?.enabled === true;
    }

    canUseAacl() {
        return this.canUseFeature("advancedAccessControlLayer");
    }

    canUseTeams() {
        if (!this.canUseAacl()) {
            return false;
        }

        return this.license.package.features.advancedAccessControlLayer.options.teams;
    }

    canUseFolderLevelPermissions() {
        if (!this.canUseAacl()) {
            return false;
        }

        return this.license.package.features.advancedAccessControlLayer.options
            .folderLevelPermissions;
    }

    canUsePrivateFiles() {
        if (!this.canUseAacl()) {
            return false;
        }

        return this.license.package.features.advancedAccessControlLayer.options.privateFiles;
    }

    canUseAuditLogs() {
        return this.canUseFeature("auditLogs");
    }

    canUseRecordLocking() {
        return this.canUseFeature("recordLocking");
    }

    canUseFileManagerThreatDetection() {
        return this.license.package.features.fileManager?.options.threatDetection ?? false;
    }

    public canUseWorkflows(): boolean {
        return this.canUseFeature("workflows");
    }
}
