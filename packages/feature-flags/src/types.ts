export interface IAaclFeatureFlags {
    teams?: boolean;
    privateFiles?: boolean;
    folderLevelPermissions?: boolean;
    hcmsFieldPermissions?: boolean;
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
    fileManager?: IFileManagerFeatureFlags;
}
