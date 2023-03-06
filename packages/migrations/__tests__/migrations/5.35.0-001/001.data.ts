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
    ...Array.from({ length: 5000 }).map((_, index) => {
        return {
            PK: "T#root#L#en-US#FM#F",
            SK: "63d0f8a1ce8f180008bb6054" + index,
            createdBy: {
                displayName: "Pavel Denisjuk",
                id: "e6ea2871-ba36-4494-87ac-afb73d4e7eb2",
                type: "admin"
            },
            createdOn: "2023-01-25T09:38:41.943Z",
            id: "63d0f8a1ce8f180008bb6054" + index,
            key: index + "welcome-to-webiny-page-8ldbh4sq4-hero-block-bg.svg",
            locale: "en-US",
            meta: {
                private: true
            },
            name: "welcome-to-webiny-page-8ldbh4sq4-hero-block-bg.svg",
            size: 1864,
            tags: [],
            tenant: "root",
            TYPE: "fm.file",
            type: "image/svg+xml",
            webinyVersion: "0.0.0",
            _ct: "2023-01-25T09:38:41.961Z",
            _et: "Files",
            _md: "2023-01-25T09:38:41.961Z"
        };
    })
];
