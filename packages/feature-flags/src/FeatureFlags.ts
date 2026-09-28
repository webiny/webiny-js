import type { IAiPowerupsFeatureFlags, IFeatureFlagsDto } from "./types.js";

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
        return this.flags.aiPowerups !== false;
    }

    isAiPageGenerationEnabled(): boolean {
        return this.isAiPowerupEnabled(flags => flags.websiteBuilder?.pageGeneration);
    }

    isAiImageEnrichmentEnabled(): boolean {
        return this.isAiPowerupEnabled(flags => flags.fileManager?.imageEnrichment);
    }

    isAiPageTranslationEnabled(): boolean {
        return this.isAiPowerupEnabled(flags => flags.websiteBuilder?.pageTranslation);
    }

    isAiLexicalGenerationEnabled(): boolean {
        return this.isAiPowerupEnabled(flags => flags.lexicalGeneration);
    }

    isAiEntryGenerationEnabled(): boolean {
        return this.isAiPowerupEnabled(flags => flags.cms?.entryGeneration);
    }

    isAiEntryComparisonEnabled(): boolean {
        return this.isAiPowerupEnabled(flags => flags.cms?.entryComparison);
    }

    isAiEntryTranslationEnabled(): boolean {
        return this.isAiPowerupEnabled(flags => flags.cms?.entryTranslation);
    }

    isAiRemoteComponentsEnabled(): boolean {
        return this.isAiPowerupEnabled(flags => flags.remoteComponents);
    }

    isAbTestingEnabled(): boolean {
        return this.flags.abTesting !== false;
    }

    isCollaborationEnabled(): boolean {
        return this.flags.collaboration !== false;
    }

    isCommentsEnabled(): boolean {
        if (this.flags.collaboration === false) {
            return false;
        }
        if (typeof this.flags.collaboration === "object") {
            return this.flags.collaboration.comments !== false;
        }
        return true;
    }

    isActivityLogEnabled(): boolean {
        if (this.flags.collaboration === false) {
            return false;
        }
        if (typeof this.flags.collaboration === "object") {
            return this.flags.collaboration.activityLog !== false;
        }
        return true;
    }

    private isAiPowerupEnabled(pick: (flags: IAiPowerupsFeatureFlags) => boolean | undefined) {
        if (this.flags.aiPowerups === false) {
            return false;
        }
        if (typeof this.flags.aiPowerups === "object") {
            return pick(this.flags.aiPowerups) !== false;
        }
        return true;
    }
}
