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
        PK: "T#root#I18N#L#D",
        SK: "default",
        code: "en-US",
        createdBy: {
            displayName: "Pavel Denisjuk",
            id: "e6ea2871-ba36-4494-87ac-afb73d4e7eb2",
            type: "admin"
        },
        createdOn: "2023-01-25T09:38:22.029Z",
        default: true,
        tenant: "root",
        webinyVersion: "0.0.0",
        _ct: "2023-01-25T09:38:22.041Z",
        _et: "I18NLocale",
        _md: "2023-01-25T09:38:22.041Z"
    },
    {
        PK: "T#root#I18N#L",
        SK: "en-US",
        code: "en-US",
        createdBy: {
            displayName: "Pavel Denisjuk",
            id: "e6ea2871-ba36-4494-87ac-afb73d4e7eb2",
            type: "admin"
        },
        createdOn: "2023-01-25T09:38:22.029Z",
        default: true,
        tenant: "root",
        webinyVersion: "0.0.0",
        _ct: "2023-01-25T09:38:22.041Z",
        _et: "I18NLocale",
        _md: "2023-01-25T09:38:22.041Z"
    },
    // TODO: delete this record in 5.36.0
    {
        PK: "T#root#L#en-US#PB#SETTINGS",
        SK: "default",
        htmlTags: {
            footer: null,
            header: null
        },
        locale: "en-US",
        name: "Sandbox",
        pages: {
            home: "63d0f8a3ce8f180008bb606b",
            notFound: "63d0f8a3ce8f180008bb606a"
        },
        social: {
            facebook: null,
            image: null,
            instagram: null,
            twitter: null
        },
        tenant: "root",
        theme: "default",
        TYPE: "pb.settings",
        websitePreviewUrl: "http://localhost:3000",
        websiteUrl: null,
        _ct: "2023-02-04T14:03:21.503Z",
        _et: "PbSettings",
        _md: "2023-02-04T14:03:21.503Z"
    }
];
