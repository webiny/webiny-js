export type WcpProjectPackage = {
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

export interface WcpProject {
    package: WcpProjectPackage;
}

export interface GetWcpProjectGqlResponse {
    wcp: {
        getProject: {
            data: WcpProject | null;
            error: {
                message: string;
                code: string;
                data: Record<string, any>;
            } | null;
        };
    };
}

export interface WcpPermission {
    name: "wcp";

    // If boolean, tells us whether the project has access to the Advanced Access Control Layer (AACL)
    // feature, based on the project's WCP license. `null` means we're dealing with an old, non-WCP,
    // project, meaning access should be allowed, even without a valid WCP license.
    aacl: boolean | null;
}
