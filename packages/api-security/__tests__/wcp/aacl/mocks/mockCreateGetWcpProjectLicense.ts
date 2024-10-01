import { DecryptedWcpProjectLicense, MT_OPTIONS_MAX_COUNT_TYPE } from "@webiny/wcp/types";

export const mockCreateGetWcpProjectLicense = (
    licenseModifier?: (license: DecryptedWcpProjectLicense) => void
) => {
    const projectPackageLicense: DecryptedWcpProjectLicense = {
        orgId: "test-org",
        projectId: "test-project",
        package: {
            features: {
                seats: {
                    enabled: true,
                    options: {
                        maxCount: 1
                    }
                },
                multiTenancy: {
                    enabled: true,
                    options: { maxCount: { type: MT_OPTIONS_MAX_COUNT_TYPE.SEAT_BASED } }
                },
                advancedPublishingWorkflow: { enabled: false },
                advancedAccessControlLayer: {
                    enabled: false,
                    options: {
                        teams: false,
                        folderLevelPermissions: false,
                        privateFiles: false
                    }
                }
            }
        }
    };

    if (licenseModifier) {
        licenseModifier(projectPackageLicense);
    }

    return () => projectPackageLicense;
};
