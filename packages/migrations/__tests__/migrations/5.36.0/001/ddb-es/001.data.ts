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

export const createFileData = () => {
    return [
        {
            PK: "T#root#L#en-US#FM#F6452c912849a140008548995",
            SK: "A",
            data: {
                aliases: [],
                createdBy: {
                    displayName: "Leonardo Giacone",
                    id: "6452c8a6849a14000854897a",
                    type: "admin"
                },
                createdOn: "2023-05-03T20:50:29.832Z",
                id: "6452c912849a140008548995",
                key: "6452c912849a140008548995/demo-logo.png",
                locale: "en-US",
                meta: {
                    private: false
                },
                name: "demo-logo.png",
                size: 14551,
                tags: [],
                tenant: "root",
                type: "image/png",
                webinyVersion: "0.0.0-unstable.606fc9c866"
            },
            GSI1_PK: "T#root#L#en-US#FM#FILES",
            GSI1_SK: "6452c912849a140008548995",
            TYPE: "fm.file",
            _ct: "2023-05-03T20:50:29.832Z",
            _et: "FM.File",
            _md: "2023-05-03T20:50:29.832Z"
        }
    ];
};

export const createFileDataDdbEs = () => {
    return [
        {
            PK: "T#root#L#en-US#FM#F6452c912849a140008548995",
            SK: "A",
            data: {
                compression: "gzip",
                value: "H4sIAAAAAAAAA32PvU7EMBCEXwVtneQcJw5OymtoEBT8FCCKPWcvsnDsKDagcLp3Z6NDnKBAW+3sN6OdA9geOmhqJU1bSl23WNZCCK1q3bYKMnil5R9g09MYcheGUEx+YNzjSMz/laP9ZLmslSozSMu0MnbEgTane8IhQvf8kgE6i5G+l5ESQneAabbvmNi0RxfpyDx59IlD5hAS+81MfO9vPUtSyCoXKhfVvRSdEp1sC13JpzO2XdbQc3ONze9il8hwb+PkcLk5Nbqm4HHuw8WVRRM8wU8P7EfrgZ9ywaBbFfL5wx0DH7SzfnmkOdqwfiYKnvzNx4Q7R0Ujmr1pjW4aOH4BXhorP4kBAAA="
            },
            index: "root-en-us-file-manager",
            _ct: "2023-05-03T20:50:29.849Z",
            _et: "FilesElasticsearch",
            _md: "2023-05-03T20:50:29.849Z"
        }
    ];
};

export const createFileDataEs = () => {
    return [
        {
            _index: "root-en-us-file-manager",
            _type: "_doc",
            _id: "T#root#L#en-US#FM#F6022814bef4a940008b3ba26:A",
            _version: 1,
            _seq_no: 0,
            _primary_term: 1,
            found: true,
            _source: {
                id: "6022814bef4a940008b3ba26",
                name: "scaffolding.svg",
                key: "demo-pages/6022814bef4a940008b3ba26/welcome-to-webiny__scaffolding.svg",
                type: "image/svg+xml",
                size: 33888,
                meta: {
                    private: true
                },
                tags: [],
                aliases: [],
                tenant: "root",
                createdOn: "2023-05-03T20:49:34.170Z",
                createdBy: {
                    id: "6452c8a6849a14000854897a",
                    displayName: "Leonardo Giacone",
                    type: "admin"
                },
                locale: "en-US",
                webinyVersion: "0.0.0-unstable.606fc9c866"
            }
        }
    ];
};
