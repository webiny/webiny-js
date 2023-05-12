export const testData = [
    {
        PK: "T#root",
        SK: "A",
        createdOn: "2023-01-25T09:37:58.183Z",
        description: "The top-level Webiny tenant.",
        GSI1_PK: "TENANTS",
        GSI1_SK: "T#null#2023-01-25T09:37:58.183Z",
        id: "root",
        name: "Root",
        savedOn: "2023-01-25T09:37:58.183Z",
        settings: {
            domains: []
        },
        status: "active",
        TYPE: "tenancy.tenant",
        webinyVersion: "0.0.0",
        _ct: "2023-01-25T09:37:58.220Z",
        _et: "TenancyTenant",
        _md: "2023-01-25T09:37:58.220Z"
    },
    {
        PK: "T#640c50f510540f0008e0950c",
        SK: "A",
        createdOn: "2023-03-11T09:59:17.327Z",
        description: "Tenant #1",
        GSI1_PK: "TENANTS",
        GSI1_SK: "T#root#2023-03-11T09:59:17.327Z",
        id: "640c50f510540f0008e0950c",
        name: "Tenant #1",
        parent: "root",
        savedOn: "2023-03-11T09:59:17.327Z",
        settings: {
            domains: []
        },
        status: "active",
        TYPE: "tenancy.tenant",
        webinyVersion: "5.35.0-dev",
        _ct: "2023-03-11T09:59:17.327Z",
        _et: "TenancyTenant",
        _md: "2023-03-11T09:59:17.327Z"
    },
    {
        PK: "T#640c515627c444000857fb44",
        SK: "A",
        createdOn: "2023-03-11T10:00:54.963Z",
        description: "Tenant #2",
        GSI1_PK: "TENANTS",
        GSI1_SK: "T#root#2023-03-11T10:00:54.963Z",
        id: "640c515627c444000857fb44",
        name: "Tenant #2",
        parent: "root",
        savedOn: "2023-03-11T10:00:54.963Z",
        settings: {
            domains: []
        },
        status: "active",
        TYPE: "tenancy.tenant",
        webinyVersion: "5.35.0-dev",
        _ct: "2023-03-11T10:00:54.963Z",
        _et: "TenancyTenant",
        _md: "2023-03-11T10:00:54.963Z"
    }
];
