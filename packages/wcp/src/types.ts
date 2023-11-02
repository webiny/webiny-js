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
    AL = "auditLogs",
    AUDIT_LOGS = "auditLogs"
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
    [PROJECT_PACKAGE_FEATURE_NAME.AACL]: {
        enabled: boolean;
        options: { teams: boolean; privateFiles: boolean; folderLevelPermissions: boolean };
    };
    [PROJECT_PACKAGE_FEATURE_NAME.AL]: {
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
