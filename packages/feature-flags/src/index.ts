export interface IAaclFeatureFlags {
    teams?: boolean;
    privateFiles?: boolean;
    folderLevelPermissions?: boolean;
}

export interface IFileManagerFeatureFlags {
    threatDetection?: boolean;
}

/**
 * Top-level feature flags interface. Add new flags here as needed.
 * A boolean value controls whether the feature is enabled.
 * An object value means the feature is enabled, but with specific sub-options.
 * Keep this file free of @webiny/* package imports.
 */
export interface IFeatureFlagsDto {
    multiTenancy?: boolean;
    advancedPublishingWorkflow?: boolean;
    advancedAccessControlLayer?: boolean | IAaclFeatureFlags;
    auditLogs?: boolean;
    recordLocking?: boolean;
    fileManager?: boolean | IFileManagerFeatureFlags;
}

export class FeatureFlags {
    static fromDto(dto: IFeatureFlagsDto): FeatureFlags {
        return new FeatureFlags(dto);
    }

    constructor(private readonly flags: IFeatureFlagsDto = {}) {}

    toDto(): IFeatureFlagsDto {
        return { ...this.flags };
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

    isFileManagerThreatDetectionEnabled(): boolean {
        if (this.flags.fileManager === false) {
            return false;
        }
        if (typeof this.flags.fileManager === "object") {
            return this.flags.fileManager.threatDetection !== false;
        }
        return true;
    }
}
