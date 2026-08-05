import type { IFeatureFlagsDto } from "./types.js";

export class FeatureFlags {
    static fromDto(dto: IFeatureFlagsDto): FeatureFlags {
        return new FeatureFlags(dto);
    }

    constructor(private readonly flags: IFeatureFlagsDto = {}) {}

    toDto() {
        return {
            multiTenancy: this.isMultiTenancyEnabled(),
            advancedPublishingWorkflow: this.isWorkflowsEnabled(),
            advancedAccessControlLayer: this.isAaclEnabled()
                ? {
                      teams: this.isTeamsEnabled(),
                      privateFiles: this.isPrivateFilesEnabled(),
                      folderLevelPermissions: this.isFolderLevelPermissionsEnabled(),
                      hcmsFieldPermissions: this.isHcmsFieldPermissionsEnabled()
                  }
                : false,
            auditLogs: this.isAuditLogsEnabled(),
            recordLocking: this.isRecordLockingEnabled(),
            fileManager: {
                threatDetection: this.isFileManagerThreatDetectionEnabled()
            },
            aiPowerups: this.isAiPowerupsEnabled()
                ? {
                      websiteBuilder: {
                          pageGeneration: this.isAiPageGenerationEnabled(),
                          pageTranslation: this.isAiPageTranslationEnabled()
                      },
                      fileManager: {
                          imageEnrichment: this.isAiImageEnrichmentEnabled()
                      },
                      lexicalGeneration: this.isAiLexicalGenerationEnabled(),
                      cms: {
                          entryGeneration: this.isAiEntryGenerationEnabled(),
                          entryComparison: this.isAiEntryComparisonEnabled(),
                          entryTranslation: this.isAiEntryTranslationEnabled()
                      }
                  }
                : false,
            abTesting: this.isAbTestingEnabled(),
            remoteComponents: this.isRemoteComponentsEnabled()
        };
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
        if (this.flags.aiPowerups === false) {
            return false;
        }
        if (typeof this.flags.aiPowerups === "object") {
            return this.flags.aiPowerups.websiteBuilder?.pageGeneration !== false;
        }
        return true;
    }

    isAiImageEnrichmentEnabled(): boolean {
        if (this.flags.aiPowerups === false) {
            return false;
        }
        if (typeof this.flags.aiPowerups === "object") {
            return this.flags.aiPowerups.fileManager?.imageEnrichment !== false;
        }
        return true;
    }

    isAiPageTranslationEnabled(): boolean {
        if (this.flags.aiPowerups === false) {
            return false;
        }
        if (typeof this.flags.aiPowerups === "object") {
            return this.flags.aiPowerups.websiteBuilder?.pageTranslation !== false;
        }
        return true;
    }

    isAiLexicalGenerationEnabled(): boolean {
        if (this.flags.aiPowerups === false) {
            return false;
        }
        if (typeof this.flags.aiPowerups === "object") {
            return this.flags.aiPowerups.lexicalGeneration !== false;
        }
        return true;
    }

    isAiEntryGenerationEnabled(): boolean {
        if (this.flags.aiPowerups === false) {
            return false;
        }
        if (typeof this.flags.aiPowerups === "object") {
            return this.flags.aiPowerups.cms?.entryGeneration !== false;
        }
        return true;
    }

    isAiEntryComparisonEnabled(): boolean {
        if (this.flags.aiPowerups === false) {
            return false;
        }
        if (typeof this.flags.aiPowerups === "object") {
            return this.flags.aiPowerups.cms?.entryComparison !== false;
        }
        return true;
    }

    isAiEntryTranslationEnabled(): boolean {
        if (this.flags.aiPowerups === false) {
            return false;
        }
        if (typeof this.flags.aiPowerups === "object") {
            return this.flags.aiPowerups.cms?.entryTranslation !== false;
        }
        return true;
    }

    isAbTestingEnabled(): boolean {
        return this.flags.abTesting !== false;
    }

    isRemoteComponentsEnabled(): boolean {
        return this.flags.remoteComponents !== false;
    }
}
