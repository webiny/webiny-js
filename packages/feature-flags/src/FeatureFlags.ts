import type { IFeatureFlagsDto } from "./types.js";

export class FeatureFlags {
    static fromDto(dto: IFeatureFlagsDto): FeatureFlags {
        return new FeatureFlags(dto);
    }

    constructor(private readonly flags: IFeatureFlagsDto = {}) {}

    toDto(): IFeatureFlagsDto {
        return structuredClone(this.flags);
    }

    isMultiTenancyEnabled(): boolean {
        return this.flags.multiTenancy !== false;
    }

    isWorkflowsEnabled(): boolean {
        return this.flags.advancedPublishingWorkflow !== false;
    }

    isAaclEnabled(): boolean {
        return this.flags.advancedAccessControlLayer !== false;
    }

    isTeamsEnabled(): boolean {
        if (this.flags.advancedAccessControlLayer === false) {
            return false;
        }
        if (typeof this.flags.advancedAccessControlLayer === "object") {
            return this.flags.advancedAccessControlLayer.teams !== false;
        }
        return true;
    }

    isPrivateFilesEnabled(): boolean {
        if (this.flags.advancedAccessControlLayer === false) {
            return false;
        }
        if (typeof this.flags.advancedAccessControlLayer === "object") {
            return this.flags.advancedAccessControlLayer.privateFiles !== false;
        }
        return true;
    }

    isFolderLevelPermissionsEnabled(): boolean {
        if (this.flags.advancedAccessControlLayer === false) {
            return false;
        }
        if (typeof this.flags.advancedAccessControlLayer === "object") {
            return this.flags.advancedAccessControlLayer.folderLevelPermissions !== false;
        }
        return true;
    }

    isAuditLogsEnabled(): boolean {
        return this.flags.auditLogs !== false;
    }

    isRecordLockingEnabled(): boolean {
        return this.flags.recordLocking !== false;
    }

    isHcmsFieldPermissionsEnabled(): boolean {
        if (this.flags.advancedAccessControlLayer === false) {
            return false;
        }
        if (typeof this.flags.advancedAccessControlLayer === "object") {
            return this.flags.advancedAccessControlLayer.hcmsFieldPermissions !== false;
        }
        return true;
    }

    isFileManagerThreatDetectionEnabled(): boolean {
        return this.flags.fileManager?.threatDetection !== false;
    }

    isAiPowerupsEnabled(): boolean {
        return this.flags.aiPowerups?.enabled !== false;
    }

    isAiPageGenerationEnabled(): boolean {
        return this.flags.aiPowerups?.options?.websiteBuilder?.pageGeneration !== false;
    }

    isAiImageEnrichmentEnabled(): boolean {
        return this.flags.aiPowerups?.options?.fileManager?.imageEnrichment !== false;
    }

    isAiLexicalGenerationEnabled(): boolean {
        return this.flags.aiPowerups?.options?.lexicalGeneration !== false;
    }
}
