import {
    DecryptedWcpProjectLicense,
    MT_OPTIONS_MAX_COUNT_TYPE,
    PROJECT_PACKAGE_FEATURE_NAME
} from "~/types";

export const createTestWcpLicense = (): DecryptedWcpProjectLicense => {
    return {
        orgId: "org-id",
        projectId: "project-id",
        package: {
            features: {
                [PROJECT_PACKAGE_FEATURE_NAME.AACL]: {
                    enabled: true,
                    options: {
                        teams: true,
                        folderLevelPermissions: true,
                        privateFiles: true
                    }
                },
                [PROJECT_PACKAGE_FEATURE_NAME.MT]: {
                    enabled: true,
                    options: {
                        maxCount: {
                            type: MT_OPTIONS_MAX_COUNT_TYPE.SEAT_BASED
                        }
                    }
                },
                [PROJECT_PACKAGE_FEATURE_NAME.APW]: {
                    enabled: false
                },
                [PROJECT_PACKAGE_FEATURE_NAME.AUDIT_LOGS]: {
                    enabled: false
                },
                [PROJECT_PACKAGE_FEATURE_NAME.RECORD_LOCKING]: {
                    enabled: false
                },
                [PROJECT_PACKAGE_FEATURE_NAME.SEATS]: {
                    enabled: true,
                    options: {
                        maxCount: 100
                    }
                }
            }
        }
    };
};
