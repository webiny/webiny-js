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
export declare enum PROJECT_PACKAGE_FEATURE_NAME {
    SEATS = "seats",
    MT = "multiTenancy",
    APW = "advancedPublishingWorkflow",
    AACL = "advancedAccessControlLayer"
}
export declare enum MT_OPTIONS_MAX_COUNT_TYPE {
    SEAT_BASED = "seatBased",
    FIXED = "fixed"
}
export interface ProjectPackageFeatures {
    [PROJECT_PACKAGE_FEATURE_NAME.SEATS]: {
        enabled: true;
        options: {
            maxCount: number;
        };
    };
    [PROJECT_PACKAGE_FEATURE_NAME.MT]: {
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
    [PROJECT_PACKAGE_FEATURE_NAME.AACL]: {
        enabled: boolean;
        options: {
            teams: boolean;
        };
    };
}
export interface DecryptedWcpProjectLicense {
    orgId: string;
    projectId: string;
    package: {
        features: ProjectPackageFeatures;
    };
}
