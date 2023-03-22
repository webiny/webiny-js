import { CmsModel } from "~/migrations/5.35.0/005/types";

const createdBy = {
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
        },
        {
            PK: "T#completelyOtherTenant",
            SK: "A",
            createdOn: "2023-03-11T10:00:54.963Z",
            description: "Tenant #2",
            GSI1_PK: "TENANTS",
            GSI1_SK: "T#root#2023-03-11T10:00:54.963Z",
            data: {
                id: "completelyOtherTenant",
                name: "Completely Other Tenant",
                parent: "root",
                savedOn: "2023-03-11T10:00:54.963Z",
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
            SK: "fr-FR",
            code: "fr-FR",
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
        },
        {
            PK: `T#completelyOtherTenant#I18N#L`,
            SK: "es-ES",
            code: "es-ES",
            default: true,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy,
            tenant: "completelyOtherTenant",
            webinyVersion: "0.0.0"
        }
    ];
};

export const createModelsData = (): CmsModel[] => {
    return [
        {
            PK: "T#root#L#en-US#CMS#CM",
            SK: "article",
            TYPE: "cms.model",
            _ct: "2023-01-25T09:37:58.220Z",
            _et: "CmsModels",
            _md: "2023-01-25T09:37:58.220Z",
            modelId: "article",
            name: "Article",
            description: "A simple article model.",
            fields: [],
            layout: [],
            lockedFields: [],
            titleFieldId: "id",
            group: {
                id: "unknown",
                name: "Unknown"
            },
            locale: "en-US",
            tenant: "root",
            createdOn: "2023-01-25T09:37:58.183Z",
            savedOn: "2023-01-25T09:37:58.183Z",
            webinyVersion: "0.0.0",
            createdBy
        },
        {
            PK: "T#root#L#en-US#CMS#CM",
            SK: "category",
            TYPE: "cms.model",
            _ct: "2023-01-25T09:37:58.220Z",
            _et: "CmsModels",
            _md: "2023-01-25T09:37:58.220Z",
            modelId: "category",
            name: "Category",
            description: "A simple category model.",
            fields: [],
            layout: [],
            lockedFields: [],
            titleFieldId: "id",
            group: {
                id: "unknown",
                name: "Unknown"
            },
            locale: "en-US",
            tenant: "root",
            createdOn: "2023-01-25T09:37:58.183Z",
            savedOn: "2023-01-25T09:37:58.183Z",
            webinyVersion: "0.0.0",
            createdBy
        },
        {
            PK: "T#root#L#en-US#CMS#CM",
            SK: "author",
            TYPE: "cms.model",
            _ct: "2023-01-25T09:37:58.220Z",
            _et: "CmsModels",
            _md: "2023-01-25T09:37:58.220Z",
            modelId: "author",
            name: "Author",
            description: "A simple author model.",
            fields: [],
            layout: [],
            lockedFields: [],
            titleFieldId: "id",
            group: {
                id: "unknown",
                name: "Unknown"
            },
            locale: "en-US",
            tenant: "root",
            createdOn: "2023-01-25T09:37:58.183Z",
            savedOn: "2023-01-25T09:37:58.183Z",
            webinyVersion: "0.0.0",
            createdBy
        },
        {
            PK: "T#root#L#de-DE#CMS#CM",
            SK: "category",
            TYPE: "cms.model",
            _ct: "2023-01-25T09:37:58.220Z",
            _et: "CmsModels",
            _md: "2023-01-25T09:37:58.220Z",
            modelId: "category",
            name: "Category DE",
            description: "A simple category model on DE locale.",
            fields: [],
            layout: [],
            lockedFields: [],
            titleFieldId: "id",
            group: {
                id: "unknown",
                name: "Unknown"
            },
            locale: "de-DE",
            tenant: "root",
            createdOn: "2023-01-25T09:37:58.183Z",
            savedOn: "2023-01-25T09:37:58.183Z",
            webinyVersion: "0.0.0",
            createdBy
        },
        {
            PK: "T#root#L#fr-FR#CMS#CM",
            SK: "category",
            TYPE: "cms.model",
            _ct: "2023-01-25T09:37:58.220Z",
            _et: "CmsModels",
            _md: "2023-01-25T09:37:58.220Z",
            modelId: "category",
            name: "Category FR",
            description: "A simple category model on FR locale.",
            fields: [],
            layout: [],
            lockedFields: [],
            titleFieldId: "id",
            group: {
                id: "unknown",
                name: "Unknown"
            },
            locale: "fr-FR",
            tenant: "root",
            createdOn: "2023-01-25T09:37:58.183Z",
            savedOn: "2023-01-25T09:37:58.183Z",
            webinyVersion: "0.0.0",
            createdBy
        },
        {
            PK: "T#root#L#fr-FR#CMS#CM",
            SK: "author",
            TYPE: "cms.model",
            _ct: "2023-01-25T09:37:58.220Z",
            _et: "CmsModels",
            _md: "2023-01-25T09:37:58.220Z",
            modelId: "author",
            name: "Author FR",
            description: "A simple author model on FR locale.",
            fields: [],
            layout: [],
            lockedFields: [],
            titleFieldId: "id",
            group: {
                id: "unknown",
                name: "Unknown"
            },
            locale: "fr-FR",
            tenant: "root",
            createdOn: "2023-01-25T09:37:58.183Z",
            savedOn: "2023-01-25T09:37:58.183Z",
            webinyVersion: "0.0.0",
            createdBy
        },
        {
            PK: "T#otherTenant#L#de-DE#CMS#CM",
            SK: "category",
            TYPE: "cms.model",
            _ct: "2023-01-25T09:37:58.220Z",
            _et: "CmsModels",
            _md: "2023-01-25T09:37:58.220Z",
            modelId: "category",
            name: "Category DE",
            description: "A simple category model on DE locale on otherTenant.",
            fields: [],
            layout: [],
            lockedFields: [],
            titleFieldId: "id",
            group: {
                id: "unknown",
                name: "Unknown"
            },
            locale: "de-DE",
            tenant: "otherTenant",
            createdOn: "2023-01-25T09:37:58.183Z",
            savedOn: "2023-01-25T09:37:58.183Z",
            webinyVersion: "0.0.0",
            createdBy
        },
        {
            PK: "T#otherTenant#L#fr-FR#CMS#CM",
            SK: "category",
            TYPE: "cms.model",
            _ct: "2023-01-25T09:37:58.220Z",
            _et: "CmsModels",
            _md: "2023-01-25T09:37:58.220Z",
            modelId: "category",
            name: "Category FR",
            description: "A simple category model on FR locale on otherTenant.",
            fields: [],
            layout: [],
            lockedFields: [],
            titleFieldId: "id",
            group: {
                id: "unknown",
                name: "Unknown"
            },
            locale: "fr-FR",
            tenant: "otherTenant",
            createdOn: "2023-01-25T09:37:58.183Z",
            savedOn: "2023-01-25T09:37:58.183Z",
            webinyVersion: "0.0.0",
            createdBy
        },
        {
            PK: "T#completelyOtherTenant#L#es-ES#CMS#CM",
            SK: "article",
            TYPE: "cms.model",
            _ct: "2023-01-25T09:37:58.220Z",
            _et: "CmsModels",
            _md: "2023-01-25T09:37:58.220Z",
            modelId: "article",
            name: "Article ES",
            description: "A simple article model on ES locale and completelyOtherTenant.",
            fields: [],
            layout: [],
            lockedFields: [],
            titleFieldId: "id",
            group: {
                id: "unknown",
                name: "Unknown"
            },
            locale: "es-ES",
            tenant: "completelyOtherTenant",
            createdOn: "2023-01-25T09:37:58.183Z",
            savedOn: "2023-01-25T09:37:58.183Z",
            webinyVersion: "0.0.0",
            createdBy
        }
    ];
};
