import type { WCP_FEATURE_LABEL } from "~/index.js";

export interface WcpProject {
    orgId: string;
    projectId: string;
}

export interface ILicense {
    // TODO: identify all places where raw license data is being used and refactor.
    getRawLicense: () => DecryptedWcpProjectLicense | null;
    getProject(): WcpProject | null;
    canUseFeature: (featureId: keyof typeof WCP_FEATURE_LABEL) => boolean;
    canUseAacl: () => boolean;
    canUseTeams: () => boolean;
    canUseAuditLogs: () => boolean;
    canUsePrivateFiles: () => boolean;
    canUseFileManagerThreatDetection: () => boolean;
    canUseFolderLevelPermissions: () => boolean;
    canUseRecordLocking: () => boolean;
    canUseWorkflows: () => boolean;
}

export declare type WcpProjectEnvironment = {
    id: string;
    apiKey: string;
    org: {
        id: string;
    };
    project: {
        id: string;
    };
};

export declare type EncryptedWcpProjectLicense = string;

export enum PROJECT_PACKAGE_FEATURE_NAME {
    SEATS = "seats",
    MT = "multiTenancy",
    APW = "advancedPublishingWorkflow",
    AACL = "advancedAccessControlLayer",
    /**
     * @deprecated Use `AUDIT_LOGS` instead.
     */
    AL = "auditLogs",
    /**
     * TODO: remove eslint disable when removing AL enum value.
     */
    // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
    AUDIT_LOGS = "auditLogs",
    RECORD_LOCKING = "recordLocking",
    FILE_MANAGER = "fileManager",
    WORKFLOWS = "workflows"
}

export enum MT_OPTIONS_MAX_COUNT_TYPE {
    SEAT_BASED = "seatBased",
    FIXED = "fixed"
}

export interface ProjectPackageFeatures {
    [PROJECT_PACKAGE_FEATURE_NAME.SEATS]: {
        // This is always true because WCP projects immediately get access to seats (by default 1 seat).
        enabled: true;
        options: {
            maxCount: number;
        };
    };
    [PROJECT_PACKAGE_FEATURE_NAME.MT]: {
        // This is always true because WCP projects immediately get access to multi-tenancy.
        enabled: true;
        options: {
            maxCount: {
                type: MT_OPTIONS_MAX_COUNT_TYPE;
                count?: number;
            };
        };
    };
    [PROJECT_PACKAGE_FEATURE_NAME.APW]: {
        enabled: boolean;
    };
    [PROJECT_PACKAGE_FEATURE_NAME.AUDIT_LOGS]: {
        enabled: boolean;
    };
    [PROJECT_PACKAGE_FEATURE_NAME.RECORD_LOCKING]: {
        enabled: boolean;
    };
    [PROJECT_PACKAGE_FEATURE_NAME.AACL]: {
        enabled: boolean;
        options: { teams: boolean; privateFiles: boolean; folderLevelPermissions: boolean };
    };
    [PROJECT_PACKAGE_FEATURE_NAME.AL]: {
        enabled: boolean;
    };
    [PROJECT_PACKAGE_FEATURE_NAME.FILE_MANAGER]: {
        enabled: boolean;
        options: { threatDetection: boolean };
    };
    [PROJECT_PACKAGE_FEATURE_NAME.WORKFLOWS]: {
        enabled: boolean;
    };
}

export interface DecryptedWcpProjectLicense {
    orgId: string;
    projectId: string;
    package: {
        features: ProjectPackageFeatures;
    };
}
