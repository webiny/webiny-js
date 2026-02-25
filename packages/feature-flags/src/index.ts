/**
 * Top-level feature flags interface. Each key represents a product/domain area.
 * Add new domains here as needed; keep this file free of @webiny/* package imports.
 */
export interface IFeatureFlags {
    wcp?: {
        multiTenancy?: { enabled?: boolean };
        advancedPublishingWorkflow?: { enabled?: boolean };
        advancedAccessControlLayer?: {
            enabled?: boolean;
            options?: {
                teams?: boolean;
                privateFiles?: boolean;
                folderLevelPermissions?: boolean;
            };
        };
        auditLogs?: { enabled?: boolean };
        recordLocking?: { enabled?: boolean };
        fileManager?: {
            options?: { threatDetection?: boolean };
        };
    };
}
