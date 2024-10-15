export const testData = [
    {
        PK: "T#root",
        SK: "A",
        data: {
            createdOn: "2023-01-25T09:37:58.183Z",
            description: "The top-level Webiny tenant.",
            id: "root",
            name: "Root",
            savedOn: "2023-01-25T09:37:58.183Z",
            settings: {
                domains: []
            },
            status: "active"
        },

        GSI1_PK: "TENANTS",
        GSI1_SK: "T#null#2023-01-25T09:37:58.183Z",
        TYPE: "tenancy.tenant",
        webinyVersion: "0.0.0",
        _ct: "2023-01-25T09:37:58.220Z",
        _et: "TenancyTenant",
        _md: "2023-01-25T09:37:58.220Z"
    },
    {
        PK: "T#root#ADMIN_USER#e6ea2871-ba36-4494-87ac-afb73d4e7eb2",
        SK: "A",
        GSI1_PK: "T#root#ADMIN_USERS",
        GSI1_SK: "admin@webiny.com",
        id: "e6ea2871-ba36-4494-87ac-afb73d4e7eb2",
        TYPE: "adminUsers.user",
        _ct: "2023-01-25T09:38:16.764Z",
        _et: "AdminUsers.User",
        _md: "2023-01-25T09:38:16.764Z",
        data: {
            createdOn: "2023-01-25T09:38:16.226Z",
            email: "admin@webiny.com",
            firstName: "Pavel",
            group: "63d0f879ce8f180008bb6051",
            lastName: "Denisjuk",
            tenant: "root",
            webinyVersion: "0.0.0"
        }
    },
    {
        PK: "T#root#ADMIN_USER#4e1adbe9-abf4-4360-b7f4-3f00bce096d9",
        SK: "A",
        GSI1_PK: "T#root#ADMIN_USERS",
        GSI1_SK: "user1@webiny.com",
        id: "4e1adbe9-abf4-4360-b7f4-3f00bce096d9",
        TYPE: "adminUsers.user",
        _ct: "2023-03-10T08:44:26.330Z",
        _et: "AdminUsers.User",
        _md: "2023-03-10T08:44:26.331Z",
        data: {
            createdBy: {
                displayName: "Pavel Denisjuk",
                id: "e6ea2871-ba36-4494-87ac-afb73d4e7eb2",
                type: "admin"
            },
            createdOn: "2023-03-10T08:44:24.401Z",
            email: "user1@webiny.com",
            firstName: "User 1",
            group: "63d0f879ce8f180008bb6051",
            lastName: "Last 1",
            tenant: "root",
            webinyVersion: "5.35.0-dev"
        }
    },
    {
        PK: "T#root#ADMIN_USER#640af04d40bae30008a097c5",
        SK: "A",
        GSI1_PK: "T#root#ADMIN_USERS",
        GSI1_SK: "user2@webiny.com",
        id: "640af04d40bae30008a097c5",
        TYPE: "adminUsers.user",
        _ct: "2023-03-10T09:03:27.732Z",
        _et: "AdminUsers.User",
        _md: "2023-03-10T09:03:27.733Z",
        data: {
            createdBy: {
                displayName: "Pavel Denisjuk",
                id: "e6ea2871-ba36-4494-87ac-afb73d4e7eb2",
                type: "admin"
            },
            createdOn: "2023-03-10T08:54:37.618Z",
            email: "user2@webiny.com",
            firstName: "Modern",
            group: "63d0f879ce8f180008bb6051",
            team: "random-team-id",
            lastName: "User",
            tenant: "root",
            webinyVersion: "5.35.0-dev"
        }
    }
];
