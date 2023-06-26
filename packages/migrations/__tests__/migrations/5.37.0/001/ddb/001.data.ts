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

export const createTenantLinksData = () => {
    return [
        {
            PK: "IDENTITY#649429aad9bd1f0008416798",
            SK: "LINK#T#root",
            createdOn: "2023-06-22T10:59:55.552Z",
            data: {
                group: "649429a0d9bd1f0008416796",
                permissions: [
                    {
                        name: "*"
                    }
                ]
            },
            GSI1_PK: "T#root",
            GSI1_SK: "TYPE#group#IDENTITY#649429aad9bd1f0008416798",
            identity: "649429aad9bd1f0008416798",
            tenant: "root",
            type: "group",
            webinyVersion: "5.36.2",
            _ct: "2023-06-22T10:59:55.552Z",
            _et: "SecurityIdentity2Tenant",
            _md: "2023-06-22T10:59:55.552Z"
        },
        {
            PK: "IDENTITY#64942e46a5d103f5dacb7792",
            SK: "LINK#T#root",
            createdOn: "2023-06-22T10:59:55.552Z",
            data: {
                group: "649429a0d9bd1f0008416796",
                permissions: [
                    {
                        name: "content.i18n"
                    },
                    {
                        name: "cms.endpoint.read"
                    },
                    {
                        name: "cms.endpoint.manage"
                    },
                    {
                        name: "cms.endpoint.preview"
                    }
                ]
            },
            GSI1_PK: "T#root",
            GSI1_SK: "TYPE#group#IDENTITY#64942e46a5d103f5dacb7792",
            identity: "64942e46a5d103f5dacb7792",
            tenant: "root",
            type: "group",
            webinyVersion: "5.36.2",
            _ct: "2023-06-22T10:59:55.552Z",
            _et: "SecurityIdentity2Tenant",
            _md: "2023-06-22T10:59:55.552Z"
        },
        {
            PK: "IDENTITY#64942e80610668b2ce7fd29d",
            SK: "LINK#T#otherTenant",
            createdOn: "2023-06-22T10:59:55.552Z",
            data: {
                group: "649429a0d9bd1f0008416796",
                permissions: [
                    {
                        name: "cms.contentModel",
                        models: {
                            "en-US": ["testAd", "adrianTest2", "adrianTest"]
                        },
                        rwd: "rwd",
                        own: false,
                        pw: null
                    },
                    {
                        name: "cms.contentModelGroup",
                        rwd: "r",
                        own: false,
                        pw: null
                    },
                    {
                        name: "cms.contentEntry",
                        rwd: "rwd",
                        own: false,
                        pw: null
                    }
                ]
            },
            GSI1_PK: "T#otherTenant",
            GSI1_SK: "TYPE#group#IDENTITY#64942e80610668b2ce7fd29d",
            identity: "64942e80610668b2ce7fd29d",
            tenant: "otherTenant",
            type: "group",
            webinyVersion: "5.36.2",
            _ct: "2023-06-22T10:59:55.552Z",
            _et: "SecurityIdentity2Tenant",
            _md: "2023-06-22T10:59:55.552Z"
        }
    ];
};
