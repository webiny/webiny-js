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

export interface DecryptedWcpProjectLicense {
    orgId: string;
    projectId: string;
    package: {
        features: {
            seats: {
                // This is always true because WCP projects immediately get access to seats (by default 1 seat).
                enabled: true;
                options: {
                    maxCount: number;
                };
            };
            multiTenancy: {
                // This is always true because WCP projects immediately get access to multi-tenancy.
                enabled: true;
            };
            advancedPublishingWorkflow: {
                enabled: boolean;
            };
            advancedAccessControlLayer: {
                enabled: boolean;
            };
        };
    };
}
