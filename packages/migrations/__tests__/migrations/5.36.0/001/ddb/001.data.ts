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
        }
    ];
};

export const createFileData = () => {
    return [
        {
            PK: "T#root#L#en-US#FM#FILE#64521f996052bf00088f5eb7", //
            SK: "A",
            data: {
                aliases: [],
                createdBy: {
                    displayName: "Leonardo Giacone",
                    id: "64521ec16052bf00088f5eb1",
                    type: "admin"
                },
                createdOn: "2023-05-03T08:47:23.511Z",
                id: "64521f996052bf00088f5eb7",
                key: "64521f996052bf00088f5eb7/demo-logo.png",
                locale: "en-US",
                meta: {
                    private: false
                },
                name: "demo-logo.png",
                size: 14551,
                tags: [],
                tenant: "root",
                type: "image/png",
                webinyVersion: "5.35.0"
            },
            GSI1_PK: "T#root#L#en-US#FM#FILES",
            GSI1_SK: "64521f996052bf00088f5eb7",
            TYPE: "fm.file",
            _ct: "2023-05-03T08:47:23.511Z",
            _et: "FM.File",
            _md: "2023-05-03T08:47:23.511Z"
        }
    ];
};

export const createAcoRecords = () => {
    return [
        {
            PK: "T#root#L#en-US#CMS#CME#CME#wby-aco-6452275f962ef800085c8bab",
            SK: "REV#0001",
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "64521ec16052bf00088f5eb1",
                type: "admin"
            },
            createdOn: "2023-05-03T09:20:33.059Z",
            entryId: "wby-aco-6452275f962ef800085c8bab",
            GSI1_PK: "T#root#L#en-US#CMS#CME#M#acoSearchRecord#A",
            GSI1_SK: "wby-aco-6452275f962ef800085c8bab#0001",
            id: "wby-aco-6452275f962ef800085c8bab#0001",
            locale: "en-US",
            locked: false,
            modelId: "acoSearchRecord",
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "64521ec16052bf00088f5eb1",
                type: "admin"
            },
            savedOn: "2023-05-03T09:20:33.059Z",
            status: "draft",
            tenant: "root",
            TYPE: "cms.entry",
            values: {
                data: {
                    aliases: [],
                    createdBy: {
                        displayName: "Leonardo Giacone",
                        id: "64521ec16052bf00088f5eb1",
                        type: "admin"
                    },
                    createdOn: "2023-05-03T09:20:33.033Z",
                    id: "6452275f962ef800085c8bab",
                    key: "6452275f962ef800085c8bab/cat-roll-1.jpg",
                    meta: {
                        private: false
                    },
                    name: "cat-roll-1.jpg",
                    size: 52859,
                    type: "image/jpeg"
                },
                location: {
                    folderId: "ROOT"
                },
                tags: ["mime:image/jpeg"],
                title: "cat-roll-1.jpg",
                type: "FmFile"
            },
            version: 1,
            webinyVersion: "0.0.0-unstable.606fc9c866",
            _ct: "2023-05-03T09:20:33.072Z",
            _et: "CmsEntries",
            _md: "2023-05-03T09:20:33.072Z"
        },
        {
            PK: "T#root#L#en-US#CMS#CME#CME#wby-aco-6452275f962ef800085c8bab",
            SK: "L",
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "64521ec16052bf00088f5eb1",
                type: "admin"
            },
            createdOn: "2023-05-03T09:20:33.059Z",
            entryId: "wby-aco-6452275f962ef800085c8bab",
            GSI1_PK: "T#root#L#en-US#CMS#CME#M#acoSearchRecord#L",
            GSI1_SK: "wby-aco-6452275f962ef800085c8bab#0001",
            id: "wby-aco-6452275f962ef800085c8bab#0001",
            locale: "en-US",
            locked: false,
            modelId: "acoSearchRecord",
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "64521ec16052bf00088f5eb1",
                type: "admin"
            },
            savedOn: "2023-05-03T09:20:33.059Z",
            status: "draft",
            tenant: "root",
            TYPE: "cms.entry.l",
            values: {
                data: {
                    aliases: [],
                    createdBy: {
                        displayName: "Leonardo Giacone",
                        id: "64521ec16052bf00088f5eb1",
                        type: "admin"
                    },
                    createdOn: "2023-05-03T09:20:33.033Z",
                    id: "6452275f962ef800085c8bab",
                    key: "6452275f962ef800085c8bab/cat-roll-1.jpg",
                    meta: {
                        private: false
                    },
                    name: "cat-roll-1.jpg",
                    size: 52859,
                    type: "image/jpeg"
                },
                location: {
                    folderId: "ROOT"
                },
                tags: ["mime:image/jpeg"],
                title: "cat-roll-1.jpg",
                type: "FmFile"
            },
            version: 1,
            webinyVersion: "0.0.0-unstable.606fc9c866",
            _ct: "2023-05-03T09:20:33.072Z",
            _et: "CmsEntries",
            _md: "2023-05-03T09:20:33.072Z"
        }
    ];
};
