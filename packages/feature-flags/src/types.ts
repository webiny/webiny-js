export interface IAaclFeatureFlags {
    teams?: boolean;
    privateFiles?: boolean;
    folderLevelPermissions?: boolean;
    hcmsFieldPermissions?: boolean;
}

export interface IFileManagerFeatureFlags {
    threatDetection?: boolean;
}

export interface IAiPowerupsWebsiteBuilderOptions {
    pageGeneration?: boolean;
}

export interface IAiPowerupsFileManagerOptions {
    imageEnrichment?: boolean;
}

export interface IAiPowerupsOptions {
    websiteBuilder?: IAiPowerupsWebsiteBuilderOptions;
    fileManager?: IAiPowerupsFileManagerOptions;
    lexicalGeneration?: boolean;
}

export interface IAiPowerupsFeatureFlags {
    enabled?: boolean;
    options?: IAiPowerupsOptions;
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
    aiPowerups?: IAiPowerupsFeatureFlags;
}
