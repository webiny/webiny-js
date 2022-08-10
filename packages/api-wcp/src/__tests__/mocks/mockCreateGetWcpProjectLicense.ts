import { DecryptedWcpProjectLicense } from "@webiny/wcp/types";

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
                multiTenancy: { enabled: true },
                advancedPublishingWorkflow: { enabled: false },
                advancedAccessControlLayer: { enabled: false }
            }
        }
    };

    if (licenseModifier) {
        licenseModifier(projectPackageLicense);
    }

    return () => projectPackageLicense;
};
