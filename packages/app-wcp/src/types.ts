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
            options: {
                teams: boolean;
                privateFiles: boolean;
                folderLevelPermissions: boolean;
            };
        };
        auditLogs: {
            enabled: boolean;
        };
    };
};

export interface WcpProject {
    orgId: string;
    projectId: string;
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

export interface AaclPermission {
    name: "aacl";
    legacy: boolean;
    teams: boolean;
}
