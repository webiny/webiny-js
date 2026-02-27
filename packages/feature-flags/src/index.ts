export interface IAaclFeatureFlags {
    teams?: boolean;
    privateFiles?: boolean;
    folderLevelPermissions?: boolean;
}

/**
 * Top-level feature flags interface. Add new flags here as needed.
 * A boolean value controls whether the feature is enabled.
 * An object value means the feature is enabled, but with specific sub-options.
 * Keep this file free of @webiny/* package imports.
 */
export interface IFeatureFlagsDto {
    multiTenancy?: boolean;
    workflows?: boolean;
    aacl?: boolean | IAaclFeatureFlags;
    auditLogs?: boolean;
    recordLocking?: boolean;
    fileManagerThreatDetection?: boolean;
}

export class FeatureFlags {
    constructor(private readonly flags: IFeatureFlagsDto = {}) {}

    isMultiTenancyEnabled(): boolean {
        return this.flags.multiTenancy !== false;
    }

    isWorkflowsEnabled(): boolean {
        return this.flags.workflows !== false;
    }

    isAaclEnabled(): boolean {
        return this.flags.aacl !== false;
    }

    isTeamsEnabled(): boolean {
        if (this.flags.aacl === false) {
            return false;
        }
        if (typeof this.flags.aacl === "object") {
            return this.flags.aacl.teams !== false;
        }
        return true;
    }

    isPrivateFilesEnabled(): boolean {
        if (this.flags.aacl === false) {
            return false;
        }
        if (typeof this.flags.aacl === "object") {
            return this.flags.aacl.privateFiles !== false;
        }
        return true;
    }

    isFolderLevelPermissionsEnabled(): boolean {
        if (this.flags.aacl === false) {
            return false;
        }
        if (typeof this.flags.aacl === "object") {
            return this.flags.aacl.folderLevelPermissions !== false;
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
        return this.flags.fileManagerThreatDetection !== false;
    }
}
