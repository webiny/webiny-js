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
            multiTenancy: {
                // Multi-tenancy is enabled the moment user's project is connected with WCP.
                // This means we can assign `true` as the type here.
                enabled: true;
            };
            advancedPublishingWorkflow: {
                enabled: boolean;
            };
        }
    };
}
