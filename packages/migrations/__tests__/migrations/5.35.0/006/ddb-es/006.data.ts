export const createdBy = {
    id: "admin",
    type: "admin",
    displayName: "Admin"
};

export const createTenantsData = () => {
    return [
        {
            PK: "T#root",
            SK: "A",
            createdOn: "2023-01-25T09:37:58.183Z",
            description: "The top-level Webiny tenant.",
            GSI1_PK: "TENANTS",
            GSI1_SK: "T#null#2023-01-25T09:37:58.183Z",
            data: {
                id: "root",
                name: "Root",
                savedOn: "2023-01-25T09:37:58.183Z",
                settings: {
                    domains: []
                },
                status: "active",
                TYPE: "tenancy.tenant",
                webinyVersion: "0.0.0",
                createdBy
            }
        },
        {
            PK: "T#otherTenant",
            SK: "A",
            createdOn: "2023-03-11T09:59:17.327Z",
            description: "Tenant #1",
            GSI1_PK: "TENANTS",
            GSI1_SK: "T#root#2023-03-11T09:59:17.327Z",
            data: {
                id: "otherTenant",
                name: "Other Tenant",
                parent: "root",
                savedOn: "2023-03-11T09:59:17.327Z",
                settings: {
                    domains: []
                },
                status: "active",
                TYPE: "tenancy.tenant",
                webinyVersion: "0.0.0",
                createdBy
            }
        }
    ];
};

export const createLocalesData = () => {
    return [
        {
            PK: `T#root#I18N#L`,
            SK: "en-US",
            code: "en-US",
            default: true,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy,
            tenant: "root",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#root#I18N#L`,
            SK: "de-DE",
            code: "de-DE",
            default: false,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy,
            tenant: "root",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#root#I18N#L`,
            SK: "fr-FR",
            code: "fr-FR",
            default: false,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy,
            tenant: "root",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#otherTenant#I18N#L`,
            SK: "ja-JP",
            code: "ja-JP",
            default: false,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy,
            tenant: "otherTenant",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#otherTenant#I18N#L`,
            SK: "de-DE",
            code: "de-DE",
            default: true,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy,
            tenant: "otherTenant",
            webinyVersion: "0.0.0"
        }
    ];
};
