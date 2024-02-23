// We commented migrations-related records because of constant changes in these.
export const ddbPrimaryTableDataMigrated = [
    {
        GSI1_PK: "T#root#GROUPS",
        GSI1_SK: "full-access",
        PK: "T#root#GROUP#658c1b60c39bb10008431b42",
        SK: "A",
        TYPE: "security.group",
        _ct: "2023-12-27T12:41:05.020Z",
        _et: "SecurityGroup",
        _md: "2023-12-27T12:41:05.020Z",
        createdOn: "2023-12-27T12:41:04.963Z",
        description: "Grants full access to all apps.",
        id: "658c1b60c39bb10008431b42",
        name: "Full Access",
        permissions: [
            {
                name: "*"
            }
        ],
        slug: "full-access",
        system: true,
        tenant: "root",
        webinyVersion: "5.38.2"
    },
    {
        GSI1_PK: "T#root#PS#TAG",
        GSI1_SK: "pb-page#658c1bd3c39bb10008431b5b#0001#/welcome-to-webiny",
        PK: "T#root#PS#TAG#pb-page#658c1bd3c39bb10008431b5b#0001#/welcome-to-webiny",
        SK: "658c1bd3c39bb10008431b5b#0001#/welcome-to-webiny",
        TYPE: "ps.tagPathLink",
        _ct: "2023-12-27T12:43:14.870Z",
        _et: "PrerenderingServiceTagPathLink",
        _md: "2023-12-27T12:43:14.870Z",
        data: {
            key: "pb-page",
            path: "/welcome-to-webiny",
            tenant: "root",
            value: "658c1bd3c39bb10008431b5b#0001"
        }
    },
    {
        PK: "T#root#L#en-US#CMS#CME#wby-aco-658c1bd3c39bb10008431b5c",
        SK: "L",
        TYPE: "L",
        created: "2023-12-27T12:43:01.122Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:43:00.024Z",
        entity: "CmsEntries",
        entryId: "wby-aco-658c1bd3c39bb10008431b5c",
        id: "wby-aco-658c1bd3c39bb10008431b5c#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "acoSearchRecord-pbpage",
        modified: "2023-12-27T12:43:01.122Z",
        modifiedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        modifiedOn: "2023-12-27T12:43:00.024Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:43:00.024Z",
        revisionModifiedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionModifiedOn: "2023-12-27T12:43:00.024Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:43:00.024Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:43:00.024Z",
        status: "draft",
        tenant: "root",
        values: {
            "object@data": {
                "boolean@locked": true,
                "datetime@createdOn": "2023-12-27T12:42:59.964Z",
                "datetime@savedOn": "2023-12-27T12:43:00.663Z",
                "number@version": 1,
                "object@createdBy": {
                    "text@displayName": "ad min",
                    "text@id": "658c1b73c39bb10008431b44",
                    "text@type": "admin"
                },
                "text@id": "658c1bd3c39bb10008431b5c#0001",
                "text@path": "/not-found",
                "text@pid": "658c1bd3c39bb10008431b5c",
                "text@status": "published",
                "text@title": "Not Found"
            },
            "object@location": {
                "text@folderId": "root"
            },
            "text@content":
                "Not Found Page not found! Sorry, but the page you were looking for could not be found. TAKE ME HOme",
            "text@tags": [],
            "text@title": "Not Found",
            "text@type": "PbPage"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#wby-aco-658c1bd3c39bb10008431b5c",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:43:01.121Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:43:00.024Z",
        entity: "CmsEntries",
        entryId: "wby-aco-658c1bd3c39bb10008431b5c",
        id: "wby-aco-658c1bd3c39bb10008431b5c#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "acoSearchRecord-pbpage",
        modified: "2023-12-27T12:43:01.121Z",
        modifiedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        modifiedOn: "2023-12-27T12:43:00.024Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:43:00.024Z",
        revisionModifiedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionModifiedOn: "2023-12-27T12:43:00.024Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:43:00.024Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:43:00.024Z",
        status: "draft",
        tenant: "root",
        values: {
            "object@data": {
                "boolean@locked": true,
                "datetime@createdOn": "2023-12-27T12:42:59.964Z",
                "datetime@savedOn": "2023-12-27T12:43:00.663Z",
                "number@version": 1,
                "object@createdBy": {
                    "text@displayName": "ad min",
                    "text@id": "658c1b73c39bb10008431b44",
                    "text@type": "admin"
                },
                "text@id": "658c1bd3c39bb10008431b5c#0001",
                "text@path": "/not-found",
                "text@pid": "658c1bd3c39bb10008431b5c",
                "text@status": "published",
                "text@title": "Not Found"
            },
            "object@location": {
                "text@folderId": "root"
            },
            "text@content":
                "Not Found Page not found! Sorry, but the page you were looking for could not be found. TAKE ME HOme",
            "text@tags": [],
            "text@title": "Not Found",
            "text@type": "PbPage"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#PB#C",
        SK: "static",
        TYPE: "pb.category",
        _ct: "2023-12-27T12:42:57.966Z",
        _et: "PbCategories",
        _md: "2023-12-27T12:42:57.966Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:57.965Z",
        layout: "static",
        locale: "en-US",
        name: "Static",
        slug: "static",
        tenant: "root",
        url: "/static/"
    },
    {
        PK: "T#root#L#en-US#PB#P#658c1bd3c39bb10008431b5c",
        SK: "L",
        TYPE: "pb.page.l",
        _ct: "2023-12-27T12:43:00.681Z",
        _et: "PbPages",
        _md: "2023-12-27T12:43:00.681Z",
        category: "static",
        content: {
            compression: "jsonpack",
            content:
                "id|h0HqpItbGT|type|document|data|settings|elements|ZlkwCyXhhc|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|pwR8zBN28v|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|6838kMd5Vh|cell|80px|size|iG8DLRffpF|heading|text|typography|heading1|alignment|tag|h1|color|color3|Page+not+found!|9UHkb1nlN1|paragraph|paragraph1|div|Sorry,+but+the+page+you+were+looking+for+could+not+be+found.|PkNZ6zIVWv|button|buttonText|TAKE+ME+HOme|30px|link|href|/|primary^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|J|-1|E|13]]|S|$14|1U]]]|6|@$0|15|2|16|4|$17|$A|$2|16|18|19|1A|O|1B|1C|1D|1E]|4|$17|1F]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|1G|2|1H|4|$17|$A|$2|1H|18|1I|1A|O|1B|1J|1D|1E]|4|$17|1K]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|1L|2|1M|4|$1N|1O|5|$D|$A|$L|F|J|-1|E|1P]]|N|$A|O]]|1Q|$1R|1S]|2|1T]|6|@]]]]]]]]]]"
        },
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:59.964Z",
        editor: "page-builder",
        id: "658c1bd3c39bb10008431b5c#0001",
        locale: "en-US",
        locked: true,
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        path: "/not-found",
        pid: "658c1bd3c39bb10008431b5c",
        publishedOn: "2023-12-27T12:43:00.663Z",
        savedOn: "2023-12-27T12:43:00.663Z",
        settings: {
            general: {
                layout: "static"
            },
            seo: {
                meta: []
            },
            social: {
                meta: []
            }
        },
        status: "published",
        tenant: "root",
        title: "Not Found",
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#PB#P#658c1bd3c39bb10008431b5c",
        SK: "P",
        TYPE: "pb.page.p",
        _ct: "2023-12-27T12:43:00.682Z",
        _et: "PbPages",
        _md: "2023-12-27T12:43:00.682Z",
        category: "static",
        content: {
            compression: "jsonpack",
            content:
                "id|h0HqpItbGT|type|document|data|settings|elements|ZlkwCyXhhc|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|pwR8zBN28v|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|6838kMd5Vh|cell|80px|size|iG8DLRffpF|heading|text|typography|heading1|alignment|tag|h1|color|color3|Page+not+found!|9UHkb1nlN1|paragraph|paragraph1|div|Sorry,+but+the+page+you+were+looking+for+could+not+be+found.|PkNZ6zIVWv|button|buttonText|TAKE+ME+HOme|30px|link|href|/|primary^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|J|-1|E|13]]|S|$14|1U]]]|6|@$0|15|2|16|4|$17|$A|$2|16|18|19|1A|O|1B|1C|1D|1E]|4|$17|1F]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|1G|2|1H|4|$17|$A|$2|1H|18|1I|1A|O|1B|1J|1D|1E]|4|$17|1K]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|1L|2|1M|4|$1N|1O|5|$D|$A|$L|F|J|-1|E|1P]]|N|$A|O]]|1Q|$1R|1S]|2|1T]|6|@]]]]]]]]]]"
        },
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:59.964Z",
        editor: "page-builder",
        id: "658c1bd3c39bb10008431b5c#0001",
        locale: "en-US",
        locked: true,
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        path: "/not-found",
        pid: "658c1bd3c39bb10008431b5c",
        publishedOn: "2023-12-27T12:43:00.663Z",
        savedOn: "2023-12-27T12:43:00.663Z",
        settings: {
            general: {
                layout: "static"
            },
            seo: {
                meta: []
            },
            social: {
                meta: []
            }
        },
        status: "published",
        tenant: "root",
        title: "Not Found",
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#PB#P#658c1bd3c39bb10008431b5c",
        SK: "REV#0001",
        TYPE: "pb.page",
        _ct: "2023-12-27T12:43:00.681Z",
        _et: "PbPages",
        _md: "2023-12-27T12:43:00.681Z",
        category: "static",
        content: {
            compression: "jsonpack",
            content:
                "id|h0HqpItbGT|type|document|data|settings|elements|ZlkwCyXhhc|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|pwR8zBN28v|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|6838kMd5Vh|cell|80px|size|iG8DLRffpF|heading|text|typography|heading1|alignment|tag|h1|color|color3|Page+not+found!|9UHkb1nlN1|paragraph|paragraph1|div|Sorry,+but+the+page+you+were+looking+for+could+not+be+found.|PkNZ6zIVWv|button|buttonText|TAKE+ME+HOme|30px|link|href|/|primary^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|J|-1|E|13]]|S|$14|1U]]]|6|@$0|15|2|16|4|$17|$A|$2|16|18|19|1A|O|1B|1C|1D|1E]|4|$17|1F]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|1G|2|1H|4|$17|$A|$2|1H|18|1I|1A|O|1B|1J|1D|1E]|4|$17|1K]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|1L|2|1M|4|$1N|1O|5|$D|$A|$L|F|J|-1|E|1P]]|N|$A|O]]|1Q|$1R|1S]|2|1T]|6|@]]]]]]]]]]"
        },
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:59.964Z",
        editor: "page-builder",
        id: "658c1bd3c39bb10008431b5c#0001",
        locale: "en-US",
        locked: true,
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        path: "/not-found",
        pid: "658c1bd3c39bb10008431b5c",
        publishedOn: "2023-12-27T12:43:00.663Z",
        savedOn: "2023-12-27T12:43:00.663Z",
        settings: {
            general: {
                layout: "static"
            },
            seo: {
                meta: []
            },
            social: {
                meta: []
            }
        },
        status: "published",
        tenant: "root",
        title: "Not Found",
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#PB#M",
        SK: "main-menu",
        TYPE: "pb.menu",
        _ct: "2023-12-27T12:42:59.821Z",
        _et: "PbMenus",
        _md: "2023-12-27T12:42:59.821Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:59.821Z",
        description: "The main menu of the website, containing links to most important pages.",
        items: [],
        locale: "en-US",
        slug: "main-menu",
        tenant: "root",
        title: "Main Menu"
    },
    {
        PK: "T#root#L#en-US#FB#SETTINGS",
        SK: "default",
        _ct: "2023-12-27T12:43:01.966Z",
        _et: "FormBuilderSettings",
        _md: "2023-12-27T12:43:01.966Z",
        domain: "https://d3hohw12noi930.cloudfront.net",
        locale: "en-US",
        reCaptcha: {
            enabled: null,
            secretKey: null,
            siteKey: null
        },
        tenant: "root"
    },
    {
        GSI1_PK: "T#root#PS#TAG",
        GSI1_SK: "pb-menu#main-menu#/",
        PK: "T#root#PS#TAG#pb-menu#main-menu#/",
        SK: "main-menu#/",
        TYPE: "ps.tagPathLink",
        _ct: "2023-12-27T12:43:19.484Z",
        _et: "PrerenderingServiceTagPathLink",
        _md: "2023-12-27T12:43:19.484Z",
        data: {
            key: "pb-menu",
            path: "/",
            tenant: "root",
            value: "main-menu"
        }
    },
    {
        GSI1_PK: "T#root#GROUPS",
        GSI1_SK: "anonymous",
        PK: "T#root#GROUP#658c1b61c39bb10008431b43",
        SK: "A",
        TYPE: "security.group",
        _ct: "2023-12-27T12:41:05.147Z",
        _et: "SecurityGroup",
        _md: "2023-12-27T12:41:05.147Z",
        createdOn: "2023-12-27T12:41:05.146Z",
        description: "Permissions for anonymous users (public access).",
        id: "658c1b61c39bb10008431b43",
        name: "Anonymous",
        permissions: [],
        slug: "anonymous",
        system: true,
        tenant: "root",
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814bef4a940008b3ba27",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.007Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814bef4a940008b3ba27",
        id: "6022814bef4a940008b3ba27#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.007Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 17711,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/6022814bef4a940008b3ba27/welcome-to-webiny__security.svg",
            "text@name": "security.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814bef4a940008b3ba27",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.007Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814bef4a940008b3ba27",
        id: "6022814bef4a940008b3ba27#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.007Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 17711,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/6022814bef4a940008b3ba27/welcome-to-webiny__security.svg",
            "text@name": "security.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CM",
        SK: "modelA",
        TYPE: "cms.model",
        _ct: "2023-12-27T13:20:12.156Z",
        _et: "CmsModels",
        _md: "2023-12-27T13:20:12.156Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:18:26.594Z",
        descriptionFieldId: "description",
        fields: [
            {
                fieldId: "title",
                helpText: null,
                id: "f2qcuuzs",
                label: "Title",
                listValidation: [],
                multipleValues: false,
                placeholderText: null,
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "text-input"
                },
                settings: {},
                storageId: "text@f2qcuuzs",
                tags: [],
                type: "text",
                validation: [
                    {
                        message: "Title is a required field.",
                        name: "required",
                        settings: {}
                    }
                ]
            },
            {
                fieldId: "description",
                helpText: null,
                id: "z2tdm05d",
                label: "Description",
                listValidation: [],
                multipleValues: false,
                placeholderText: null,
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "long-text-text-area"
                },
                settings: {},
                storageId: "long-text@z2tdm05d",
                tags: [],
                type: "long-text",
                validation: []
            },
            {
                fieldId: "image",
                helpText: null,
                id: "8y67xrmj",
                label: "Image",
                listValidation: [],
                multipleValues: false,
                placeholderText: null,
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "file-input"
                },
                settings: {
                    imagesOnly: true
                },
                storageId: "file@8y67xrmj",
                tags: [],
                type: "file",
                validation: []
            }
        ],
        group: {
            id: "658c1bcbc39bb10008431b45",
            name: "Ungrouped"
        },
        imageFieldId: "image",
        layout: [["f2qcuuzs"], ["z2tdm05d", "8y67xrmj"]],
        locale: "en-US",
        lockedFields: [
            {
                fieldId: "text@f2qcuuzs",
                multipleValues: false,
                type: "text"
            },
            {
                fieldId: "long-text@z2tdm05d",
                multipleValues: false,
                type: "long-text"
            },
            {
                fieldId: "file@8y67xrmj",
                multipleValues: false,
                type: "file"
            }
        ],
        modelId: "modelA",
        name: "ModelA",
        pluralApiName: "ModelAs",
        savedOn: "2023-12-27T13:18:39.298Z",
        singularApiName: "ModelA",
        tags: ["type:model"],
        tenant: "root",
        titleFieldId: "title",
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CM",
        SK: "modelB",
        TYPE: "cms.model",
        _ct: "2023-12-27T13:22:45.032Z",
        _et: "CmsModels",
        _md: "2023-12-27T13:22:45.032Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:21:39.663Z",
        descriptionFieldId: "description",
        fields: [
            {
                fieldId: "title",
                helpText: null,
                id: "4dep2w2h",
                label: "Title",
                listValidation: [],
                multipleValues: false,
                placeholderText: null,
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "text-input"
                },
                settings: {},
                storageId: "text@4dep2w2h",
                tags: [],
                type: "text",
                validation: [
                    {
                        message: "Title is a required field.",
                        name: "required",
                        settings: {}
                    }
                ]
            },
            {
                fieldId: "description",
                helpText: null,
                id: "7c5t8wwa",
                label: "Description",
                listValidation: [],
                multipleValues: false,
                placeholderText: null,
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "long-text-text-area"
                },
                settings: {},
                storageId: "long-text@7c5t8wwa",
                tags: [],
                type: "long-text",
                validation: []
            },
            {
                fieldId: "image",
                helpText: null,
                id: "5atpz8nu",
                label: "Image",
                listValidation: [],
                multipleValues: false,
                placeholderText: null,
                predefinedValues: {
                    enabled: false,
                    values: []
                },
                renderer: {
                    name: "file-input"
                },
                settings: {
                    imagesOnly: true
                },
                storageId: "file@5atpz8nu",
                tags: [],
                type: "file",
                validation: []
            }
        ],
        group: {
            id: "658c1bcbc39bb10008431b45",
            name: "Ungrouped"
        },
        imageFieldId: "image",
        layout: [["4dep2w2h"], ["7c5t8wwa", "5atpz8nu"]],
        locale: "en-US",
        lockedFields: [
            {
                fieldId: "text@4dep2w2h",
                multipleValues: false,
                type: "text"
            },
            {
                fieldId: "long-text@7c5t8wwa",
                multipleValues: false,
                type: "long-text"
            },
            {
                fieldId: "file@5atpz8nu",
                multipleValues: false,
                type: "file"
            }
        ],
        modelId: "modelB",
        name: "ModelB",
        pluralApiName: "ModelBs",
        savedOn: "2023-12-27T13:21:46.459Z",
        singularApiName: "ModelB",
        tags: ["type:model"],
        tenant: "root",
        titleFieldId: "title",
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228145f98841000981c721",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.262Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228145f98841000981c721",
        id: "60228145f98841000981c721#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.262Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 27804,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228145f98841000981c721/welcome-to-webiny__developer.svg",
            "text@name": "developer.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228145f98841000981c721",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.261Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228145f98841000981c721",
        id: "60228145f98841000981c721#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.261Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 27804,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228145f98841000981c721/welcome-to-webiny__developer.svg",
            "text@name": "developer.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#SYSTEM",
        SK: "ADMIN_USERS",
        TYPE: "adminUsers.system",
        _ct: "2023-12-27T12:41:24.444Z",
        _et: "AdminUsers.System",
        _md: "2023-12-27T12:41:24.444Z",
        tenant: "root",
        version: "5.38.2"
    },
    {
        PK: "T#root#SYSTEM",
        SK: "CMS",
        _ct: "2023-12-27T12:42:51.969Z",
        _et: "CmsSystem",
        _md: "2023-12-27T12:42:51.969Z",
        tenant: "root",
        version: "5.38.2"
    },
    {
        PK: "T#root#SYSTEM",
        SK: "FB",
        _ct: "2023-12-27T12:43:01.981Z",
        _et: "FormBuilderSystem",
        _md: "2023-12-27T12:43:01.981Z",
        tenant: "root",
        version: "5.38.2"
    },
    {
        PK: "T#root#SYSTEM",
        SK: "FM",
        _ct: "2023-12-27T12:42:52.301Z",
        _et: "System",
        _md: "2023-12-27T12:42:52.301Z",
        tenant: "root",
        version: "5.38.2"
    },
    {
        PK: "T#root#SYSTEM",
        SK: "I18N",
        _ct: "2023-12-27T12:42:49.990Z",
        _et: "I18NSystem",
        _md: "2023-12-27T12:42:49.990Z",
        tenant: "root",
        version: "5.38.2"
    },
    {
        PK: "T#root#SYSTEM",
        SK: "PB",
        _ct: "2023-12-27T12:43:01.256Z",
        _et: "PbSystem",
        _md: "2023-12-27T12:43:01.256Z",
        tenant: "root",
        version: "5.38.2"
    },
    {
        PK: "T#root#SYSTEM",
        SK: "SECURITY",
        _ct: "2023-12-27T12:41:05.169Z",
        _et: "SecuritySystem",
        _md: "2023-12-27T12:41:05.169Z",
        installedOn: "2023-12-27T12:41:05.169Z",
        tenant: "root",
        version: "5.38.2"
    },
    {
        PK: "T#root#SYSTEM",
        SK: "TENANCY",
        _ct: "2023-12-27T12:40:58.981Z",
        _et: "TenancySystem",
        _md: "2023-12-27T12:40:58.981Z",
        version: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814b7a77e60008f70d62",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:58.903Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814b7a77e60008f70d62",
        id: "6022814b7a77e60008f70d62#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:58.903Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 1864,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/6022814b7a77e60008f70d62/welcome-to-webiny__hero-block-bg.svg",
            "text@name": "hero-block-bg.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814b7a77e60008f70d62",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:58.903Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814b7a77e60008f70d62",
        id: "6022814b7a77e60008f70d62#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:58.903Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 1864,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/6022814b7a77e60008f70d62/welcome-to-webiny__hero-block-bg.svg",
            "text@name": "hero-block-bg.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#602282e07a77e60008f70d63",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:58.944Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "602282e07a77e60008f70d63",
        id: "602282e07a77e60008f70d63#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:58.944Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 888,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/602282e07a77e60008f70d63/welcome-to-webiny__hero-feature-card-bg.svg",
            "text@name": "feature-card-bg.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#602282e07a77e60008f70d63",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:58.944Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "602282e07a77e60008f70d63",
        id: "602282e07a77e60008f70d63#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:58.944Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 888,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/602282e07a77e60008f70d63/welcome-to-webiny__hero-feature-card-bg.svg",
            "text@name": "feature-card-bg.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        GSI1_PK: "T#root#PS#TAG",
        GSI1_SK: "pb-menu#main-menu#/welcome-to-webiny",
        PK: "T#root#PS#TAG#pb-menu#main-menu#/welcome-to-webiny",
        SK: "main-menu#/welcome-to-webiny",
        TYPE: "ps.tagPathLink",
        _ct: "2023-12-27T12:43:14.870Z",
        _et: "PrerenderingServiceTagPathLink",
        _md: "2023-12-27T12:43:14.870Z",
        data: {
            key: "pb-menu",
            path: "/welcome-to-webiny",
            tenant: "root",
            value: "main-menu"
        }
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c24996607be00087f1167",
        SK: "L",
        created: "2023-12-27T13:20:25.735Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:20:25.235Z",
        entity: "CmsEntries",
        entryId: "658c24996607be00087f1167",
        firstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        firstPublishedOn: "2023-12-27T13:20:25.701Z",
        id: "658c24996607be00087f1167#0001",
        lastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        lastPublishedOn: "2023-12-27T13:20:25.701Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        modelId: "modelA",
        modified: "2023-12-27T13:20:25.735Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        publishedOn: "2023-12-27T13:20:25.701Z",
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:20:25.235Z",
        revisionFirstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionFirstPublishedOn: "2023-12-27T13:20:25.701Z",
        revisionLastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionLastPublishedOn: "2023-12-27T13:20:25.701Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:20:25.701Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:20:25.701Z",
        status: "published",
        tenant: "root",
        values: {
            "long-text@z2tdm05d": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBUcM0rKapUMAIAFvZsCRgAAAA="
            },
            "text@f2qcuuzs": "DDB+ES - Model A Entry 2"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c24996607be00087f1167",
        SK: "P",
        TYPE: "cms.entry.p",
        created: "2023-12-27T13:20:25.724Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:20:25.235Z",
        entity: "CmsEntries",
        entryId: "658c24996607be00087f1167",
        firstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        firstPublishedOn: "2023-12-27T13:20:25.701Z",
        id: "658c24996607be00087f1167#0001",
        lastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        lastPublishedOn: "2023-12-27T13:20:25.701Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        modelId: "modelA",
        modified: "2023-12-27T13:20:25.724Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        publishedOn: "2023-12-27T13:20:25.701Z",
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:20:25.235Z",
        revisionFirstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionFirstPublishedOn: "2023-12-27T13:20:25.701Z",
        revisionLastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionLastPublishedOn: "2023-12-27T13:20:25.701Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:20:25.701Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:20:25.701Z",
        status: "published",
        tenant: "root",
        values: {
            "long-text@z2tdm05d": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBUcM0rKapUMAIAFvZsCRgAAAA="
            },
            "text@f2qcuuzs": "DDB+ES - Model A Entry 2"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c24996607be00087f1167",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T13:20:25.723Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:20:25.235Z",
        entity: "CmsEntries",
        entryId: "658c24996607be00087f1167",
        firstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        firstPublishedOn: "2023-12-27T13:20:25.701Z",
        id: "658c24996607be00087f1167#0001",
        lastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        lastPublishedOn: "2023-12-27T13:20:25.701Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        modelId: "modelA",
        modified: "2023-12-27T13:20:25.723Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        publishedOn: "2023-12-27T13:20:25.701Z",
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:20:25.235Z",
        revisionFirstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionFirstPublishedOn: "2023-12-27T13:20:25.701Z",
        revisionLastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionLastPublishedOn: "2023-12-27T13:20:25.701Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:20:25.701Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:20:25.701Z",
        status: "published",
        tenant: "root",
        values: {
            "long-text@z2tdm05d": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBUcM0rKapUMAIAFvZsCRgAAAA="
            },
            "text@f2qcuuzs": "DDB+ES - Model A Entry 2"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228145f98841000981c720",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.105Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228145f98841000981c720",
        id: "60228145f98841000981c720#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.105Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 28918,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228145f98841000981c720/welcome-to-webiny__adaptable-icon.svg",
            "text@name": "adaptable-icon.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228145f98841000981c720",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.105Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228145f98841000981c720",
        id: "60228145f98841000981c720#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.105Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 28918,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228145f98841000981c720/welcome-to-webiny__adaptable-icon.svg",
            "text@name": "adaptable-icon.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#602281486ed41f0008bc2dab",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.202Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "602281486ed41f0008bc2dab",
        id: "602281486ed41f0008bc2dab#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.202Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 67402,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/602281486ed41f0008bc2dab/welcome-to-webiny__permission-icon.svg",
            "text@name": "permission-icon.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#602281486ed41f0008bc2dab",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.202Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "602281486ed41f0008bc2dab",
        id: "602281486ed41f0008bc2dab#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.202Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 67402,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/602281486ed41f0008bc2dab/welcome-to-webiny__permission-icon.svg",
            "text@name": "permission-icon.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#I18N#L#D",
        SK: "default",
        _ct: "2023-12-27T12:42:49.523Z",
        _et: "I18NLocale",
        _md: "2023-12-27T12:42:49.523Z",
        code: "en-US",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:48.245Z",
        default: true,
        tenant: "root",
        webinyVersion: "5.38.2"
    },
    {
        PK: "APW#SETTINGS",
        SK: "default",
        eventRuleName: "wby-apw-scheduler-event-rule-3889a7f",
        eventTargetId: "wby-apw-scheduler-event-rule-target-34a2e04",
        mainGraphqlFunctionArn:
            "arn:aws:lambda:eu-central-1:674320871285:function:wby-graphql-670ccd3"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#wby-aco-658c1bd3c39bb10008431b5b",
        SK: "L",
        TYPE: "L",
        created: "2023-12-27T12:43:01.107Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:43:00.006Z",
        entity: "CmsEntries",
        entryId: "wby-aco-658c1bd3c39bb10008431b5b",
        id: "wby-aco-658c1bd3c39bb10008431b5b#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "acoSearchRecord-pbpage",
        modified: "2023-12-27T12:43:01.107Z",
        modifiedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        modifiedOn: "2023-12-27T12:43:00.006Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:43:00.006Z",
        revisionModifiedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionModifiedOn: "2023-12-27T12:43:00.006Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:43:00.006Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:43:00.006Z",
        status: "draft",
        tenant: "root",
        values: {
            "object@data": {
                "boolean@locked": true,
                "datetime@createdOn": "2023-12-27T12:42:59.947Z",
                "datetime@savedOn": "2023-12-27T12:43:00.723Z",
                "number@version": 1,
                "object@createdBy": {
                    "text@displayName": "ad min",
                    "text@id": "658c1b73c39bb10008431b44",
                    "text@type": "admin"
                },
                "text@id": "658c1bd3c39bb10008431b5b#0001",
                "text@path": "/welcome-to-webiny",
                "text@pid": "658c1bd3c39bb10008431b5b",
                "text@status": "published",
                "text@title": "Welcome to Webiny"
            },
            "object@location": {
                "text@folderId": "root"
            },
            "text@content":
                "Welcome to Webiny Welcome to Webiny Webiny makes it easy to build applications and websites on top of the serverless infrastructure by providing you with a ready-made CMS and a development framework. Scalable Webiny apps can scale to handle the most demanding workloads. No custom tooling required Webiny eliminates the need to build custom tooling to create serverless app Cost effective Webiny apps run on serverless infrastructure which costs 80% less than VMs Resolves serverless challenges Webiny removes all the challenges of building serverless applications Get to know Webiny products Architect. Code. Deploy. Webiny Serverless Application Framework Everything you need to create and deploy applications on top of the serverless infrastructure.&nbsp; Use it to build: Full-stack applicationsMulti-tenant solutions APIsMicroservice Learn more An easier way to build serverless apps There are many solutions that help you run, deploy and monitor serverless functions, but when it comes to actually coding one, there are none. Webiny is a solution that helps you code your serverless app by providing you with all the components like ACL, routing, file storage and many more. Framework features Users, groups, roles &amp; scopes Security is a crucial layer in any application. Webiny includes a full-featured security module that's connected to the built-in GraphQL API.Users, groups, roles &amp; scopes Scaffolding Quickly generate boilerplate code using CLI plugins. From lambda functions to new GraphQL APIs. Customizable security Use the default AWS Cognito, or replace with 3rd party identity providers like Okta, Auth0, etc. Using plugins you can make Webiny work with any identity provider. Multiple environments No code change goes directly into a production environment. Webiny CLI makes it easy to manage and create multiple environments for your project. One size doesn't fit all It's a very different set of requirements a technical team has to a marketing team to a business development team. Webiny Serverless CMS comes with several different apps you can use independently, or together as part of a cohesive solution. Webiny Serverless CMS A suite of applications to help you manage your content. Use it to build: Marketing sites Multi-website solutions Content hubs Multi-language sites Intranet portals Headless content models Learn more CMS benefits Scalable No matter the demand, Webiny Serverless CMS can easily scale to meet even the most challenging workloads. Adaptable Being an open-source project, it's easy to modify and adapt things to your own needs. Low cost of ownership Self-hosted on top of serverless infrastructure. No infrastructure to mange, less people required to operate and maintain. Secure Secured by AWS Cognito. It's also easy to integrate services like OKTA, Auth0 and similar. Data ownership Webiny is self-hosted, it means your data stays within your data center. Permission control Powerful options to control the permissions your users will have. They perfectly align with your business requirements.&nbsp; Serverless makes infrastructure easy, Webiny makes serverless easy 1. Developer-friendly Webiny has been made with the developer in mind. It helps them develop serverless applications with ease. 2. Open source Webiny is created and maintained by an amazing group of people. Being open source means Webiny grows and evolves much faster. Contributor are welcome. 3. Community We have an active community on slack. Talk to the core-team, and get help. Webiny team is always there for any questions. View Webiny on GitHub",
            "text@tags": [],
            "text@title": "Welcome to Webiny",
            "text@type": "PbPage"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#wby-aco-658c1bd3c39bb10008431b5b",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:43:01.107Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:43:00.006Z",
        entity: "CmsEntries",
        entryId: "wby-aco-658c1bd3c39bb10008431b5b",
        id: "wby-aco-658c1bd3c39bb10008431b5b#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "acoSearchRecord-pbpage",
        modified: "2023-12-27T12:43:01.107Z",
        modifiedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        modifiedOn: "2023-12-27T12:43:00.006Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:43:00.006Z",
        revisionModifiedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionModifiedOn: "2023-12-27T12:43:00.006Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:43:00.006Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:43:00.006Z",
        status: "draft",
        tenant: "root",
        values: {
            "object@data": {
                "boolean@locked": true,
                "datetime@createdOn": "2023-12-27T12:42:59.947Z",
                "datetime@savedOn": "2023-12-27T12:43:00.723Z",
                "number@version": 1,
                "object@createdBy": {
                    "text@displayName": "ad min",
                    "text@id": "658c1b73c39bb10008431b44",
                    "text@type": "admin"
                },
                "text@id": "658c1bd3c39bb10008431b5b#0001",
                "text@path": "/welcome-to-webiny",
                "text@pid": "658c1bd3c39bb10008431b5b",
                "text@status": "published",
                "text@title": "Welcome to Webiny"
            },
            "object@location": {
                "text@folderId": "root"
            },
            "text@content":
                "Welcome to Webiny Welcome to Webiny Webiny makes it easy to build applications and websites on top of the serverless infrastructure by providing you with a ready-made CMS and a development framework. Scalable Webiny apps can scale to handle the most demanding workloads. No custom tooling required Webiny eliminates the need to build custom tooling to create serverless app Cost effective Webiny apps run on serverless infrastructure which costs 80% less than VMs Resolves serverless challenges Webiny removes all the challenges of building serverless applications Get to know Webiny products Architect. Code. Deploy. Webiny Serverless Application Framework Everything you need to create and deploy applications on top of the serverless infrastructure.&nbsp; Use it to build: Full-stack applicationsMulti-tenant solutions APIsMicroservice Learn more An easier way to build serverless apps There are many solutions that help you run, deploy and monitor serverless functions, but when it comes to actually coding one, there are none. Webiny is a solution that helps you code your serverless app by providing you with all the components like ACL, routing, file storage and many more. Framework features Users, groups, roles &amp; scopes Security is a crucial layer in any application. Webiny includes a full-featured security module that's connected to the built-in GraphQL API.Users, groups, roles &amp; scopes Scaffolding Quickly generate boilerplate code using CLI plugins. From lambda functions to new GraphQL APIs. Customizable security Use the default AWS Cognito, or replace with 3rd party identity providers like Okta, Auth0, etc. Using plugins you can make Webiny work with any identity provider. Multiple environments No code change goes directly into a production environment. Webiny CLI makes it easy to manage and create multiple environments for your project. One size doesn't fit all It's a very different set of requirements a technical team has to a marketing team to a business development team. Webiny Serverless CMS comes with several different apps you can use independently, or together as part of a cohesive solution. Webiny Serverless CMS A suite of applications to help you manage your content. Use it to build: Marketing sites Multi-website solutions Content hubs Multi-language sites Intranet portals Headless content models Learn more CMS benefits Scalable No matter the demand, Webiny Serverless CMS can easily scale to meet even the most challenging workloads. Adaptable Being an open-source project, it's easy to modify and adapt things to your own needs. Low cost of ownership Self-hosted on top of serverless infrastructure. No infrastructure to mange, less people required to operate and maintain. Secure Secured by AWS Cognito. It's also easy to integrate services like OKTA, Auth0 and similar. Data ownership Webiny is self-hosted, it means your data stays within your data center. Permission control Powerful options to control the permissions your users will have. They perfectly align with your business requirements.&nbsp; Serverless makes infrastructure easy, Webiny makes serverless easy 1. Developer-friendly Webiny has been made with the developer in mind. It helps them develop serverless applications with ease. 2. Open source Webiny is created and maintained by an amazing group of people. Being open source means Webiny grows and evolves much faster. Contributor are welcome. 3. Community We have an active community on slack. Talk to the core-team, and get help. Webiny team is always there for any questions. View Webiny on GitHub",
            "text@tags": [],
            "text@title": "Welcome to Webiny",
            "text@type": "PbPage"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        GSI1_PK: "T#root#PS#RENDER",
        GSI1_SK: "/",
        PK: "T#root#PS#RENDER#/",
        SK: "A",
        TYPE: "ps.render",
        _ct: "2023-12-27T12:43:19.454Z",
        _et: "PrerenderingServiceRender",
        _md: "2023-12-27T12:43:19.454Z",
        data: {
            files: [
                {
                    meta: {
                        tags: [
                            {
                                key: "pb-page",
                                value: "658c1bd3c39bb10008431b5b#0001"
                            },
                            {
                                key: "pb-menu",
                                value: "main-menu"
                            }
                        ]
                    },
                    name: "index.html",
                    type: "text/html"
                },
                {
                    meta: {},
                    name: "graphql.json",
                    type: "application/json"
                }
            ],
            locale: "en-US",
            path: "/",
            tenant: "root"
        }
    },
    {
        PK: "T#root#L#en-US#PB#P#658c1bd3c39bb10008431b5b",
        SK: "L",
        TYPE: "pb.page.l",
        _ct: "2023-12-27T12:43:00.864Z",
        _et: "PbPages",
        _md: "2023-12-27T12:43:00.864Z",
        category: "static",
        content: {
            compression: "jsonpack",
            content:
                'id|Fv1PpPWu-|type|document|data|settings|elements|xqt7BI4iN9|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|100px|275px|16px|tablet|horizontalAlignFlex|center|verticalAlign|flex-start|background|image|file|6022814b7a77e60008f70d62|src|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814b7a77e60008f70d62/welcome-to-webiny__hero-block-bg.svg|gdE7Q7rcA|grid|1100px|20px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|_fbQO4Nlpp|cell|size|cdk_pclqE|6022814b0df4b000088735bc|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814b0df4b000088735bc/welcome-to-webiny__webiny-logo.svg|height|44px|ovLRNqyVu3|wmMU13uZ10|1eUZzAvoB|heading|text|typography|heading1|alignment|tag|h1|color|color6|<b>Welcome+to+Webiny</b>|F6ZREnQcc|64px|oEgjDLVXUu|0xYOozhJw|paragraph|paragraph1|div|Webiny+makes+it+easy+to+build+applications+and+websites+on+top+of+the+serverless+infrastructure+by+providing+you+with+a+ready-made+CMS+and+a+development+framework.<br>|20%25|20%25|gwhTOrZvc|30px|6-6|EaIMtHtOIw|-8px|px|602282e07a77e60008f70d63|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602282e07a77e60008f70d63/welcome-to-webiny__hero-feature-card-bg.svg|8k7zxQUTm|heading6|h6|Scalable|qNngQ1C-5|paragraph2|Webiny+apps+can+scale+to+handle+the+most+demanding+workloads.<br>|uBv_VRv0i|8px|iQaW4vjKg|No+custom+tooling+required|Wy3Tw-Lb8|Webiny+eliminates+the+need+to+build+custom+tooling+to+create+serverless+app<br>|uwrjoSZkB|Q39eQZm_8z|zSVZIwnSQ0|Cost+effective|S-Ydr4kX6k|Webiny+apps+run+on+serverless+infrastructure+which+costs+80%25+less+than+VMs<br>|nUX2JXYjhD|8z0hL8l7ay|Resolves+serverless+challenges|04ZNIcAGE_|Webiny+removes+all+the+challenges+of+building+serverless+applications<br>|vm0cFfH8KG|100%25|65px|75px|txeqybzKr3|80px|wMjC2uv8cj|Pm7ws20iA|color3|<b>Get+to+know+Webiny+products</b>|6CPpd558B|heading2|h2|Architect.+Code.+Deploy.|1e0_OJgMx|gpYd80MXeg|40px|15px|kAYc-QClR|4-8|border|style|solid|rgba(229,+229,+229,+1)|1|8i803wClVt|p55J-BkDn|6022814a0df4b000088735bb|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814a0df4b000088735bb/welcome-to-webiny__webiny-serverless-application-framework.svg|90px|link|8nddxG64r|PR-yiR65n|heading3|h3|Webiny+Serverless+</p><p>Application+Framework|pVH9_fFLM|x0SSJvgrdD|b0iE8vr2S|Everything+you+need+to+create+and+deploy+applications+on+top+of+the+serverless+infrastructure.&nbsp;<br>|JMSKwWsT_|OU70Y990tA|T_M_Ww4Wb|heading4|h4|Use+it+to+build:|806nmKOyc|g59JmcyM-7|Cyziie_SK|list|<ul>\n++++++++++++++++++++<li>Full-stack+applications<br></li><li>Multi-tenant+solutions<br></li>\n++++++++++++++++</ul>|ST0O1ZeCk|ILrAABWXiX|<ul>\n++++++++++++++++++++<li>APIs</li><li>Microservice</li>\n++++++++++++++++</ul>|XxXGeIywO|9H5t3COdbo|mc0_RS9rg|button|buttonText|Learn+more|50px|href|https://www.webiny.com/serverless-application-framework/|newTab|primary|icon|fas|long-arrow-alt-right|svg|<svg+width="16"+viewBox="0+0+448+512"><path+d="M313.941+216H12c-6.627+0-12+5.373-12+12v56c0+6.627+5.373+12+12+12h301.941v46.059c0+21.382+25.851+32.09+40.971+16.971l86.059-86.059c9.373-9.373+9.373-24.569+0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971+16.971V216z"+fill="currentColor"></path></svg>|position|16|Kg3rMc1Re|LAcQHMs8K|8oaRz-Gko_|9fQ9W-xiB|6022814891bd1300087bd24c|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814891bd1300087bd24c/welcome-to-webiny__webiny-infrastructure-overview.svg|YCG34DB89|xvBXD_QTkN|GqW2LBMzV|An+easier+way+to+build+serverless+apps|9cWYQwXUd|There+are+many+solutions+that+help+you+run,+deploy+and+monitor+serverless+functions,+but+when+it+comes+to+actually+coding+one,+there+are+none.+Webiny+is+a+solution+that+helps+you+code+your+serverless+app+by+providing+you+with+all+the+components+like+ACL,+routing,+file+storage+and+many+more.<br>|LxqyquKlYy|100%25|60px|177px|60228148f98841000981c723|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148f98841000981c723/welcome-to-webiny__pink-shape.svg|yqrzxoDllE|70px|bD-TQmZyW8|4ESAx7NxM|<b>Framework+features</b>|Xr7NLMpzm|3-3-3-3|_RtRioPOsj|12px|mOr47ImJK|AlTNw-76F8|r0e8MiCuK|6022814bef4a940008b3ba27|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814bef4a940008b3ba27/welcome-to-webiny__security.svg|170px|QFwbqHtSh|DH-C0-mBsO|XSN-oY3V3|<b>Users,+groups,+roles+&amp;+scopes</b>|Unyhp8o-a|Security+is+a+crucial+layer+in+any+application.+Webiny+includes+a+full-featured+security+module+that\'s+connected+to+the+built-in+GraphQL+API.Users,+groups,+roles+&amp;+scopes<br>|Ntcduee0-|0b66dbGkG|PoRqI9i2xE|0ZpnBSqjoz|6022814bef4a940008b3ba26|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814bef4a940008b3ba26/welcome-to-webiny__scaffolding.svg|FFGobMHHI|IWxl_nrRkr|I5btsZceI|<b>Scaffolding</b>|5qvaQSnP6|Quickly+generate+boilerplate+code+using+CLI+plugins.+From+lambda+functions+to+new+GraphQL+APIs.<br>|YHUznp7ZM5|PlxqV_uS7B|zKQYI-EIFl|frRuzWpRI|60228148f98841000981c724|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148f98841000981c724/welcome-to-webiny__idp.svg|M1tvv840H|fwreagGdac|6H1tgEViY|<b>Customizable+security</b>|h0Ctka4TED|Use+the+default+AWS+Cognito,+or+replace+with+3rd+party+identity+providers+like+Okta,+Auth0,+etc.+Using+plugins+you+can+make+Webiny+work+with+any+identity+provider.<br>|SyyrOA60AF|GvU31fd4U|1vAxZAkD9O|dlI-qhVLKy|6022814bef4a940008b3ba28|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814bef4a940008b3ba28/welcome-to-webiny__environments.svg|ftA7NOOxG|WU58SBDPP8|QtYfpt1yoE|<b>Multiple+environments</b>|mmpGUzg6o1|No+code+change+goes+directly+into+a+production+environment.+Webiny+CLI+makes+it+easy+to+manage+and+create+multiple+environments+for+your+project.<br>|wYK9BhaanZ|100%25|125px|ur1DQFl5BR|TzBvXtU2PH|-PU3iBlQ4|A6sNR3MR-5|Xtqk_itss|602281486ed41f0008bc2dad|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486ed41f0008bc2dad/welcome-to-webiny__webiny-serverless-cms.png|495px|bsKTDygik|ev9nhHISRw|1BBr9ACuM|One+size+doesn\'t+fit+all|0olguTqDN|It\'s+a+very+different+set+of+requirements+a+technical+team+has+to+a+marketing+team+to+a+business+development+team.+Webiny+Serverless+CMS+comes+with+several+different+apps+you+can+use+independently,+or+together+as+part+of+a+cohesive+solution.<br>|BhnYb3VW7D|QYZ290WhC|rgba(238,+238,+238,+1)|ER2SFYwbeK|gZp3Hxm5Js|602281486639200009fd35eb|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486639200009fd35eb/welcome-to-webiny__serverless-cms-logo.svg|FsOaMudE8|ElruSYJxWM|Webiny+Serverless+</p><p>CMS|9HJcM89Am|8Cp2ZC30_H|qrS5wswdQ|heading5|h5|A+suite+of+applications+to+help+you+manage+your+content.+|pLUutc-E2|MGlDcu91q_|A6rStUekq|<b>Use+it+to+build:</b>|jIdakfVZU|5JHsGc_Rq-|SNOFqUK6lI|<ul>\n++++++++++++++++++++<li>Marketing+sites</li>\n++++++++++++++++++++<li>Multi-website+solutions</li>\n++++++++++++++++++++<li>Content+hubs<br></li>\n++++++++++++++++</ul>|96dJBnIlc|5cPfb7AwXH|<ul>\n++++++++++++++++++++<li>Multi-language+sites<br></li>\n++++++++++++++++++++<li>Intranet+portals<br></li>\n++++++++++++++++++++<li>Headless+content+models<br></li>\n++++++++++++++++</ul>|L4dFyzBKMM|Learn+more|https://www.webiny.com/serverless-cms/|<svg+width="16"+viewBox="0+0+448+512"><path+d="M313.941+216H12c-6.627+0-12+5.373-12+12v56c0+6.627+5.373+12+12+12h301.941v46.059c0+21.382+25.851+32.09+40.971+16.971l86.059-86.059c9.373-9.373+9.373-24.569+0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971+16.971V216z"+fill="currentColor"></path></svg>|mjmNmloeUS|100%25|220px|602281486639200009fd35ec|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486639200009fd35ec/welcome-to-webiny__cms-benefits-shape.svg|xUkOEAm5X3|Kgr1ambSuG|AP_uTrgLZ|<b>CMS+benefits</b>|juBaAPJ76|4-4-4|s95PSAToXK|35px|ZECp8jcZD|60228148fa244d0008c47c79|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148fa244d0008c47c79/welcome-to-webiny__scalable-icon.svg|146px|EyKog1RmH|<b>Scalable</b>|_8lCcwhUN|No+matter+the+demand,+Webiny+Serverless+CMS+can+easily+scale+to+meet+even+the+most+challenging+workloads.<br>|SmrEQ9OZ8|QWM8cmlQEM|60228145f98841000981c720|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228145f98841000981c720/welcome-to-webiny__adaptable-icon.svg|TYx-A5YCI|<b>Adaptable</b>|SsbWKZz_Z|Being+an+open-source+project,+it\'s+easy+to+modify+and+adapt+things+to+your+own+needs.<br>|gqdtbKfv7l|jBWaxzt-4|6022814851197600081724ae|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814851197600081724ae/welcome-to-webiny__cost-icon.svg|NLSOIstf9|<b>Low+cost+of+ownership</b>|kI-neIjkXx|Self-hosted+on+top+of+serverless+infrastructure.+No+infrastructure+to+mange,+less+people+required+to+operate+and+maintain.<br>|V14HHGmXN|-djsQadY-8|pTVeVoKkTi|bM5b8O7IMY|<b>Secure</b>|l9PuI-TdVA|Secured+by+AWS+Cognito.+It\'s+also+easy+to+integrate+services+like+OKTA,+Auth0+and+similar.<br>|N1lW0cAasg|W-ub9guhLt|602281486ed41f0008bc2dac|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486ed41f0008bc2dac/welcome-to-webiny__data-icon.svg|DVhLZfrM53|<b>Data+ownership</b>|shmIumNfIu|Webiny+is+self-hosted,+it+means+your+data+stays+within+your+data+center.+<br>|8F7J_16a46|2gtT4Mfw6c|602281486ed41f0008bc2dab|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486ed41f0008bc2dab/welcome-to-webiny__permission-icon.svg|5EMJkVWgKW|<b>Permission+control</b>|cdSOjFAWkf|Powerful+options+to+control+the+permissions+your+users+will+have.+They+perfectly+align+with+your+business+requirements.&nbsp;<br>|5ggqk561Ka|100%25|C6B8QfkUXs|ChF1iOAbtb|7tRfsJ_SEz|Serverless+makes+infrastructure+easy,+</p><p>Webiny+makes+serverless+easy|oYf9t6Uwz|RdazJP-4W1|7jBNW1iTi|60228145f98841000981c721|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228145f98841000981c721/welcome-to-webiny__developer.svg|200px|npNMgLft0|1.+Developer-friendly|DpubDRaGQ|Webiny+has+been+made+with+the+developer+in+mind.+It+helps+them+develop+serverless+applications+with+ease.<br>|KbQocaayR|KDO-Ja7wS|60228145f98841000981c71f|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228145f98841000981c71f/welcome-to-webiny__octo-cat.svg|ETll3nkV4|2.+Open+source|UWPjvO7EC|Webiny+is+created+and+maintained+by+an+amazing+group+of+people.+Being+open+source+means+Webiny+grows+and+evolves+much+faster.+<a+href="https://github.com/webiny/webiny-js/blob/v5/docs/CONTRIBUTING.md">Contributor</a>+are+welcome.<br>|En4soRn06o|fqxeYbEV4|60228148fa244d0008c47c7a|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148fa244d0008c47c7a/welcome-to-webiny__community-icon.png|276px|e5v0LBbfz|3.+Community|p9FWp5yqUy|We+have+an+active+community+on+<a+href="https://webiny.com/slack">slack</a>.+Talk+to+the+core-team,+and+get+help.+Webiny+team+is+always+there+for+any+questions.<br>|OYp5Z-6Xo|woaE-6v5bN|Y8ndbn88hy|View+Webiny+on+GitHub|https://github.com/webiny/webiny-js|secondary|fab|github|<svg+width="16"+viewBox="0+0+496+512"><path+d="M165.9+397.4c0+2-2.3+3.6-5.2+3.6-3.3.3-5.6-1.3-5.6-3.6+0-2+2.3-3.6+5.2-3.6+3-.3+5.6+1.3+5.6+3.6zm-31.1-4.5c-.7+2+1.3+4.3+4.3+4.9+2.6+1+5.6+0+6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2+2.3zm44.2-1.7c-2.9.7-4.9+2.6-4.6+4.9.3+2+2.9+3.3+5.9+2.6+2.9-.7+4.9-2.6+4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8+8C106.1+8+0+113.3+0+252c0+110.9+69.8+205.8+169.5+239.2+12.8+2.3+17.3-5.6+17.3-12.1+0-6.2-.3-40.4-.3-61.4+0+0-70+15-84.7-29.8+0+0-11.4-29.1-27.8-36.6+0+0-22.9-15.7+1.6-15.4+0+0+24.9+2+38.6+25.8+21.9+38.6+58.6+27.5+72.9+20.9+2.3-16+8.8-27.1+16-33.7-55.9-6.2-112.3-14.3-112.3-110.5+0-27.5+7.6-41.3+23.6-58.9-2.6-6.5-11.1-33.3+2.6-67.9+20.9-6.5+69+27+69+27+20-5.6+41.5-8.5+62.8-8.5s42.8+2.9+62.8+8.5c0+0+48.1-33.6+69-27+13.7+34.7+5.2+61.4+2.6+67.9+16+17.7+25.8+31.5+25.8+58.9+0+96.5-58.9+104.2-114.8+110.5+9.2+7.9+17+22.9+17+46.4+0+33.7-.3+75.4-.3+83.6+0+6.5+4.6+14.4+17.3+12.1C428.2+457.8+496+362.9+496+252+496+113.3+383.5+8+244.8+8zM97.2+352.9c-1.3+1-1+3.3.7+5.2+1.6+1.6+3.9+2.3+5.2+1+1.3-1+1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7+1.3.3+2.9+2.3+3.9+1.6+1+3.6.7+4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4+35.6c-1.6+1.3-1+4.3+1.3+6.2+2.3+2.3+5.2+2.6+6.5+1+1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6+1-1.6+3.6+0+5.9+1.6+2.3+4.3+3.3+5.6+2.3+1.6-1.3+1.6-3.9+0-6.2-1.4-2.3-4-3.3-5.6-2z"+fill="currentColor"></path></svg>^C|C|C|6|6|6|6|C|6|3|9|C|C|6|6|C|6|C|C|C|3|C|C|3|C|C|3|C|C|3|C|C|6|C|C|6|3|9|C|C|6|6|C|4|4|4|4|4|4|C|4|4|4|C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|N|H|O|I|P|G|P]|Q|$J|-1|I|M|G|M]]|R|$A|S]|T|$A|U]|V|$A|$W|$X|$0|Y|Z|10]]]]]]|6|@$0|11|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|14|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|1C|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BC]]]|6|@$0|1F|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|1G|Z|1H]|1I|1J]]|6|@]]]]]]|$0|1K|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|1L|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BD]]]|6|@$0|1M|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|1V]|4|$1O|1W]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|1X|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|1Y|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|1Z|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BE]]]|6|@$0|20|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|1V]|4|$1O|24]]|5|$D|$A|$L|F]]|K|$A|$L|F|J|-1|I|25|G|26]|Q|$I|F|G|F|J|-1]]]]|6|@]]]]]]|$0|27|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|2A|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2B|J|-1]|1A|$J|-1|I|F|H|P]|Q|$I|2C]]|K|$A|$L|F]]|12|$1E|BF]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2F|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|2I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|2J|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|2L]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|2M|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2N|J|-1]|1A|$J|-1|I|F]]|K|$A|$L|F]]|12|$1E|BG]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2O|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|2P]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|2Q|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|2R]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|2S|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]|1A|$J|-2]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|2T|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2B|J|-1]|1A|$J|-1|I|F|H|P]]|K|$A|$L|F]]|12|$1E|BH]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2U|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|2V]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|2W|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|2X]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|2Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2N|J|-1]|Q|$J|-1|I|2N|E|F]|1A|$J|-1|I|F]]|K|$A|$L|F]]|12|$1E|BI]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2Z|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|30]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|31|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|32]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]]]|$0|33|2|8|4|$5|$9|$A|$B|34]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|35|H|36|I|P|G|P]]|R|$A|S]|T|$A|U]]]|6|@$0|37|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|38|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|39|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BJ]]]|6|@$0|3A|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|3C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|3D|2|1N|4|$1O|$A|$2|1N|1P|3E|1R|S|1S|3F|1U|3B]|4|$1O|3G]]|5|$D|$A|$L|F|J|-1|E|P]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|3H|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|3I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|G|3K]|1A|$J|-1|G|F]]|12|$1E|BK]]]|6|@$0|3L|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|28|I|F|J|-1]]|12|$15|3M]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|S]|3N|$A|$3O|3P|1U|3Q|9|$L|3R|J|-1|H|3R]]]]]|6|@$0|3S|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BL]]]|6|@$0|3T|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|3U|Z|3V]|1I|3W]|3X|$]]|6|@]]]]|$0|3Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BM]]]|6|@$0|3Z|2|1N|4|$1O|$A|$2|1N|1P|40|1R|I|1S|41|1U|3B]|4|$1O|42]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|43|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|44|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BN]]]|6|@$0|45|2|21|4|$1O|$A|$2|21|1P|22|1R|I|1S|23|1U|3B]|4|$1O|46]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|47|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|P|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|48|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BO]]]|6|@$0|49|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|I|1S|4B|1U|3B]|4|$1O|4C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|4D|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|4E|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BP]]]|6|@$0|4F|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|4H]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|4I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BQ]]]|6|@$0|4J|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|4K]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|4L|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|4M|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BR]]]|6|@$0|4N|2|4O|4|$4P|4Q|5|$D|$A|$L|F|J|-1|E|4R]]|R|$A|U]]|3X|$4S|4T|4U|-1]|2|4V|4W|$0|@4X|4Y]|4Z|50|51|G|9|52]]|6|@]]]]]]]]|$0|53|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$E|F|G|F|H|F|I|F|L|F|J|-1]]|K|$A|$L|F|J|-1|I|3K]|1A|$J|-1|I|F]]|12|$1E|BS]]]|6|@$0|54|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|55|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BT]]]|6|@$0|56|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|57|Z|58]]|3X|$]]|6|@]]]]]]|$0|59|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5A|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BU]]]|6|@$0|5B|2|1N|4|$1O|$A|$2|1N|1P|3E|1R|I|1S|3F|1U|3B]|4|$1O|5C]]|5|$D|$A|$L|F|J|-1]]|K|$A|$L|F]]]]|6|@]]|$0|5D|2|21|4|$1O|$A|$2|21|1P|22|1R|I|1S|23|1U|3B]|4|$1O|5E]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]]]]]]]]]|$0|5F|2|8|4|$5|$9|$A|$B|5G]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|5H|G|P|H|5I|I|P|J|-1]]|R|$A|S]|T|$A|U]|V|$A|$W|$X|$0|5J|Z|5K]]]]]]|6|@$0|5L|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|5M|I|F|J|-1]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5N|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BV]]]|6|@$0|5O|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|5P]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|5Q|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|5R]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5S|2|1D|4|$5|$D|$A|$E|F|G|F|H|3J|I|F|J|-1]]|K|$A|$L|F|J|-1|G|5T]|1A|$I|5T|J|-1]]|12|$1E|BW]]]|6|@$0|5U|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5V|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BX]]]|6|@$0|5W|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|5X|Z|5Y]|1I|5Z]|3X|$]]|6|@]]]]]]|$0|60|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|14|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|61|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BY]]]|6|@$0|62|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|63]]|5|$D|$A|$L|F|J|-1|H|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|64|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|65]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|66|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|5T|G|5T]]|12|$1E|BZ]]]|6|@$0|67|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|68|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C0]]]|6|@$0|69|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6A|Z|6B]|1I|5Z]]|6|@]]]]]]|$0|6C|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6D|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C1]]]|6|@$0|6E|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|6F]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|6G|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|6H]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]|$0|6I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|5T|G|5T]]|12|$1E|C2]]]|6|@$0|6J|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6K|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C3]]]|6|@$0|6L|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6M|Z|6N]|1I|5Z]|3X|$]]|6|@]]]]]]|$0|6O|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6P|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C4]]]|6|@$0|6Q|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|6R]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|6S|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|6T]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]|$0|6U|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|5T]|1A|$G|5T|J|-1]]|12|$1E|C5]]]|6|@$0|6V|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6W|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C6]]]|6|@$0|6X|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6Y|Z|6Z]|1I|5Z]]|6|@]]]]]]|$0|70|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|71|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C7]]]|6|@$0|72|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|73]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|74|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|75]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]]]]]|$0|76|2|8|4|$5|$9|$A|$B|77]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|78|G|P|H|36|I|P|J|-1]]|R|$A|S]|T|$A|U]]]|6|@$0|79|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7A|2|1D|4|$5|$D|$A|$E|F|G|F|H|38|I|F|J|-1]|1A|$J|-1]]|K|$A|$L|F|J|-1|G|3K]|1A|$J|-1|G|F]]|12|$1E|C8]]]|6|@$0|7B|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7C|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C9]]]|6|@$0|7D|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|7E|Z|7F]|9|7G]]|6|@]]]]]]|$0|7H|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CA]]]|6|@$0|7J|2|1N|4|$1O|$A|$2|1N|1P|3E|1R|I|1S|3F|1U|3B]|4|$1O|7K]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|7L|2|21|4|$1O|$A|$2|21|1P|22|1R|I|1S|23|1U|3B]|4|$1O|7M]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]|$0|7N|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|J|-1|I|3K]|1A|$J|-1|I|F]]|12|$1E|CB]]]|6|@$0|7O|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|28|I|F|J|-1]]|12|$15|3M]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]|3N|$A|$3O|3P|1U|7P|9|$J|-1|H|3R]]]]]|6|@$0|7Q|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CC]]]|6|@$0|7R|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|7S|Z|7T]|1I|3W]|3X|$]]|6|@]]]]|$0|7U|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CD]]]|6|@$0|7V|2|1N|4|$1O|$A|$2|1N|1P|40|1R|I|1S|41]|4|$1O|7W]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|7X|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CE]]]|6|@$0|7Z|2|1N|4|$1O|$A|$2|1N|1P|80|1R|I|1S|81|1U|3B]|4|$1O|82]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|83|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|4R|G|F|H|14|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|84|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CF]]]|6|@$0|85|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|I|1S|4B|1U|3B]|4|$1O|86]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|87|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|88|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CG]]]|6|@$0|89|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|8A]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|8B|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CH]]]|6|@$0|8C|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|8D]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|8E|2|4O|4|$4P|8F|5|$D|$A|$L|F|J|-1|E|4R]]|R|$A|U]]|3X|$4S|8G|4U|-1]|2|4V|4W|$0|@4X|4Y]|4Z|8H|51|G|9|52]]|6|@]]]]]]]]|$0|8I|2|8|4|$5|$9|$A|$B|8J]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|38|H|8K|I|P|G|P]]|R|$A|S]|T|$A|U]|V|$A|$W|$X|$0|8L|Z|8M]]]]]]|6|@$0|8N|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|5H|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|8O|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CI]]]|6|@$0|8P|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|8Q]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|8R|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|8S]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|8T|2|1D|4|$5|$D|$A|$E|F|G|F|H|3J|I|F|J|-1]]|K|$A|$L|F|J|-1|G|8U]|1A|$J|-1|G|8U|I|8U]]|12|$1E|CJ]]]|6|@$0|8V|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|8W|Z|8X]|1I|8Y]|3X|$]]|6|@]]|$0|8Z|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|90]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|91|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|92]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|93|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|8U|G|8U]]|12|$1E|CK]]]|6|@$0|94|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|95|Z|96]|1I|8Y]|3X|$]]|6|@]]|$0|97|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|98]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|99|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|9A]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|9B|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|8U]|1A|$J|-1|G|8U]]|12|$1E|CL]]]|6|@$0|9C|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|9D|Z|9E]|1I|8Y]|3X|$]]|6|@]]|$0|9F|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|9G]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|9H|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|9I]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|9J|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|5H|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|8S]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|9K|2|1D|4|$5|$D|$A|$E|F|G|F|H|3J|I|F|J|-1]]|K|$A|$L|F|J|-1|G|8U]|1A|$J|-1|I|8U]]|12|$1E|CM]]]|6|@$0|9L|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6M|Z|6N]|1I|8Y]|3X|$]]|6|@]]|$0|9M|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|9N]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|9O|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|9P]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|9Q|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|8U|G|8U]]|12|$1E|CN]]]|6|@$0|9R|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|9S|Z|9T]|1I|8Y]|3X|$]]|6|@]]|$0|9U|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|9V]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|9W|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23]|4|$1O|9X]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|9Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|8U]|1A|$J|-1|G|8U]]|12|$1E|CO]]]|6|@$0|9Z|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|A0|Z|A1]|1I|8Y]|3X|$]]|6|@]]|$0|A2|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|A3]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|A4|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|A5]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]]]]]|$0|A6|2|8|4|$5|$9|$A|$B|A7]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|N|H|N|I|P|G|P]]|R|$A|S]|T|$A|U]]]|6|@$0|A8|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|A9|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CP]]]|6|@$0|AA|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|AB]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|AC|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|38|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|8S]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|AD|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|G|4R]|1A|$G|4R|J|-1|I|4R]]|12|$1E|CQ]]]|6|@$0|AE|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|AF|Z|AG]|1I|AH]|3X|$]]|6|@]]|$0|AI|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|AJ]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]|$0|AK|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|AL]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|AM|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|4R|G|4R]]|12|$1E|CR]]]|6|@$0|AN|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|AO|Z|AP]|1I|AH]|3X|$]]|6|@]]|$0|AQ|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|AR]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]|$0|AS|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|AT]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|AU|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|4R]]|K|$A|$L|F|J|-1|I|4R]|1A|$J|-1|I|4R|G|4R]]|12|$1E|CS]]]|6|@$0|AV|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|AW|Z|AX]|1I|AH|9|AY]|3X|$]]|6|@]]|$0|AZ|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|B0]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|B1|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|B2]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|B3|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|3J|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|B4|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CT]]]|6|@$0|B5|2|4O|4|$4P|B6|5|$D|$A|$L|F]]|R|$A|S]]|3X|$4S|B7|4U|-1]|2|B8|4W|$0|@B9|BA]|4Z|BB|9|52]]|6|@]]]]]]]]]]'
        },
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:59.947Z",
        editor: "page-builder",
        id: "658c1bd3c39bb10008431b5b#0001",
        locale: "en-US",
        locked: true,
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        path: "/welcome-to-webiny",
        pid: "658c1bd3c39bb10008431b5b",
        publishedOn: "2023-12-27T12:43:00.723Z",
        savedOn: "2023-12-27T12:43:00.723Z",
        settings: {
            general: {
                layout: "static"
            },
            seo: {
                meta: []
            },
            social: {
                meta: []
            }
        },
        status: "published",
        tenant: "root",
        title: "Welcome to Webiny",
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#PB#P#658c1bd3c39bb10008431b5b",
        SK: "P",
        TYPE: "pb.page.p",
        _ct: "2023-12-27T12:43:00.881Z",
        _et: "PbPages",
        _md: "2023-12-27T12:43:00.881Z",
        category: "static",
        content: {
            compression: "jsonpack",
            content:
                'id|Fv1PpPWu-|type|document|data|settings|elements|xqt7BI4iN9|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|100px|275px|16px|tablet|horizontalAlignFlex|center|verticalAlign|flex-start|background|image|file|6022814b7a77e60008f70d62|src|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814b7a77e60008f70d62/welcome-to-webiny__hero-block-bg.svg|gdE7Q7rcA|grid|1100px|20px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|_fbQO4Nlpp|cell|size|cdk_pclqE|6022814b0df4b000088735bc|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814b0df4b000088735bc/welcome-to-webiny__webiny-logo.svg|height|44px|ovLRNqyVu3|wmMU13uZ10|1eUZzAvoB|heading|text|typography|heading1|alignment|tag|h1|color|color6|<b>Welcome+to+Webiny</b>|F6ZREnQcc|64px|oEgjDLVXUu|0xYOozhJw|paragraph|paragraph1|div|Webiny+makes+it+easy+to+build+applications+and+websites+on+top+of+the+serverless+infrastructure+by+providing+you+with+a+ready-made+CMS+and+a+development+framework.<br>|20%25|20%25|gwhTOrZvc|30px|6-6|EaIMtHtOIw|-8px|px|602282e07a77e60008f70d63|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602282e07a77e60008f70d63/welcome-to-webiny__hero-feature-card-bg.svg|8k7zxQUTm|heading6|h6|Scalable|qNngQ1C-5|paragraph2|Webiny+apps+can+scale+to+handle+the+most+demanding+workloads.<br>|uBv_VRv0i|8px|iQaW4vjKg|No+custom+tooling+required|Wy3Tw-Lb8|Webiny+eliminates+the+need+to+build+custom+tooling+to+create+serverless+app<br>|uwrjoSZkB|Q39eQZm_8z|zSVZIwnSQ0|Cost+effective|S-Ydr4kX6k|Webiny+apps+run+on+serverless+infrastructure+which+costs+80%25+less+than+VMs<br>|nUX2JXYjhD|8z0hL8l7ay|Resolves+serverless+challenges|04ZNIcAGE_|Webiny+removes+all+the+challenges+of+building+serverless+applications<br>|vm0cFfH8KG|100%25|65px|75px|txeqybzKr3|80px|wMjC2uv8cj|Pm7ws20iA|color3|<b>Get+to+know+Webiny+products</b>|6CPpd558B|heading2|h2|Architect.+Code.+Deploy.|1e0_OJgMx|gpYd80MXeg|40px|15px|kAYc-QClR|4-8|border|style|solid|rgba(229,+229,+229,+1)|1|8i803wClVt|p55J-BkDn|6022814a0df4b000088735bb|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814a0df4b000088735bb/welcome-to-webiny__webiny-serverless-application-framework.svg|90px|link|8nddxG64r|PR-yiR65n|heading3|h3|Webiny+Serverless+</p><p>Application+Framework|pVH9_fFLM|x0SSJvgrdD|b0iE8vr2S|Everything+you+need+to+create+and+deploy+applications+on+top+of+the+serverless+infrastructure.&nbsp;<br>|JMSKwWsT_|OU70Y990tA|T_M_Ww4Wb|heading4|h4|Use+it+to+build:|806nmKOyc|g59JmcyM-7|Cyziie_SK|list|<ul>\n++++++++++++++++++++<li>Full-stack+applications<br></li><li>Multi-tenant+solutions<br></li>\n++++++++++++++++</ul>|ST0O1ZeCk|ILrAABWXiX|<ul>\n++++++++++++++++++++<li>APIs</li><li>Microservice</li>\n++++++++++++++++</ul>|XxXGeIywO|9H5t3COdbo|mc0_RS9rg|button|buttonText|Learn+more|50px|href|https://www.webiny.com/serverless-application-framework/|newTab|primary|icon|fas|long-arrow-alt-right|svg|<svg+width="16"+viewBox="0+0+448+512"><path+d="M313.941+216H12c-6.627+0-12+5.373-12+12v56c0+6.627+5.373+12+12+12h301.941v46.059c0+21.382+25.851+32.09+40.971+16.971l86.059-86.059c9.373-9.373+9.373-24.569+0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971+16.971V216z"+fill="currentColor"></path></svg>|position|16|Kg3rMc1Re|LAcQHMs8K|8oaRz-Gko_|9fQ9W-xiB|6022814891bd1300087bd24c|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814891bd1300087bd24c/welcome-to-webiny__webiny-infrastructure-overview.svg|YCG34DB89|xvBXD_QTkN|GqW2LBMzV|An+easier+way+to+build+serverless+apps|9cWYQwXUd|There+are+many+solutions+that+help+you+run,+deploy+and+monitor+serverless+functions,+but+when+it+comes+to+actually+coding+one,+there+are+none.+Webiny+is+a+solution+that+helps+you+code+your+serverless+app+by+providing+you+with+all+the+components+like+ACL,+routing,+file+storage+and+many+more.<br>|LxqyquKlYy|100%25|60px|177px|60228148f98841000981c723|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148f98841000981c723/welcome-to-webiny__pink-shape.svg|yqrzxoDllE|70px|bD-TQmZyW8|4ESAx7NxM|<b>Framework+features</b>|Xr7NLMpzm|3-3-3-3|_RtRioPOsj|12px|mOr47ImJK|AlTNw-76F8|r0e8MiCuK|6022814bef4a940008b3ba27|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814bef4a940008b3ba27/welcome-to-webiny__security.svg|170px|QFwbqHtSh|DH-C0-mBsO|XSN-oY3V3|<b>Users,+groups,+roles+&amp;+scopes</b>|Unyhp8o-a|Security+is+a+crucial+layer+in+any+application.+Webiny+includes+a+full-featured+security+module+that\'s+connected+to+the+built-in+GraphQL+API.Users,+groups,+roles+&amp;+scopes<br>|Ntcduee0-|0b66dbGkG|PoRqI9i2xE|0ZpnBSqjoz|6022814bef4a940008b3ba26|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814bef4a940008b3ba26/welcome-to-webiny__scaffolding.svg|FFGobMHHI|IWxl_nrRkr|I5btsZceI|<b>Scaffolding</b>|5qvaQSnP6|Quickly+generate+boilerplate+code+using+CLI+plugins.+From+lambda+functions+to+new+GraphQL+APIs.<br>|YHUznp7ZM5|PlxqV_uS7B|zKQYI-EIFl|frRuzWpRI|60228148f98841000981c724|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148f98841000981c724/welcome-to-webiny__idp.svg|M1tvv840H|fwreagGdac|6H1tgEViY|<b>Customizable+security</b>|h0Ctka4TED|Use+the+default+AWS+Cognito,+or+replace+with+3rd+party+identity+providers+like+Okta,+Auth0,+etc.+Using+plugins+you+can+make+Webiny+work+with+any+identity+provider.<br>|SyyrOA60AF|GvU31fd4U|1vAxZAkD9O|dlI-qhVLKy|6022814bef4a940008b3ba28|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814bef4a940008b3ba28/welcome-to-webiny__environments.svg|ftA7NOOxG|WU58SBDPP8|QtYfpt1yoE|<b>Multiple+environments</b>|mmpGUzg6o1|No+code+change+goes+directly+into+a+production+environment.+Webiny+CLI+makes+it+easy+to+manage+and+create+multiple+environments+for+your+project.<br>|wYK9BhaanZ|100%25|125px|ur1DQFl5BR|TzBvXtU2PH|-PU3iBlQ4|A6sNR3MR-5|Xtqk_itss|602281486ed41f0008bc2dad|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486ed41f0008bc2dad/welcome-to-webiny__webiny-serverless-cms.png|495px|bsKTDygik|ev9nhHISRw|1BBr9ACuM|One+size+doesn\'t+fit+all|0olguTqDN|It\'s+a+very+different+set+of+requirements+a+technical+team+has+to+a+marketing+team+to+a+business+development+team.+Webiny+Serverless+CMS+comes+with+several+different+apps+you+can+use+independently,+or+together+as+part+of+a+cohesive+solution.<br>|BhnYb3VW7D|QYZ290WhC|rgba(238,+238,+238,+1)|ER2SFYwbeK|gZp3Hxm5Js|602281486639200009fd35eb|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486639200009fd35eb/welcome-to-webiny__serverless-cms-logo.svg|FsOaMudE8|ElruSYJxWM|Webiny+Serverless+</p><p>CMS|9HJcM89Am|8Cp2ZC30_H|qrS5wswdQ|heading5|h5|A+suite+of+applications+to+help+you+manage+your+content.+|pLUutc-E2|MGlDcu91q_|A6rStUekq|<b>Use+it+to+build:</b>|jIdakfVZU|5JHsGc_Rq-|SNOFqUK6lI|<ul>\n++++++++++++++++++++<li>Marketing+sites</li>\n++++++++++++++++++++<li>Multi-website+solutions</li>\n++++++++++++++++++++<li>Content+hubs<br></li>\n++++++++++++++++</ul>|96dJBnIlc|5cPfb7AwXH|<ul>\n++++++++++++++++++++<li>Multi-language+sites<br></li>\n++++++++++++++++++++<li>Intranet+portals<br></li>\n++++++++++++++++++++<li>Headless+content+models<br></li>\n++++++++++++++++</ul>|L4dFyzBKMM|Learn+more|https://www.webiny.com/serverless-cms/|<svg+width="16"+viewBox="0+0+448+512"><path+d="M313.941+216H12c-6.627+0-12+5.373-12+12v56c0+6.627+5.373+12+12+12h301.941v46.059c0+21.382+25.851+32.09+40.971+16.971l86.059-86.059c9.373-9.373+9.373-24.569+0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971+16.971V216z"+fill="currentColor"></path></svg>|mjmNmloeUS|100%25|220px|602281486639200009fd35ec|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486639200009fd35ec/welcome-to-webiny__cms-benefits-shape.svg|xUkOEAm5X3|Kgr1ambSuG|AP_uTrgLZ|<b>CMS+benefits</b>|juBaAPJ76|4-4-4|s95PSAToXK|35px|ZECp8jcZD|60228148fa244d0008c47c79|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148fa244d0008c47c79/welcome-to-webiny__scalable-icon.svg|146px|EyKog1RmH|<b>Scalable</b>|_8lCcwhUN|No+matter+the+demand,+Webiny+Serverless+CMS+can+easily+scale+to+meet+even+the+most+challenging+workloads.<br>|SmrEQ9OZ8|QWM8cmlQEM|60228145f98841000981c720|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228145f98841000981c720/welcome-to-webiny__adaptable-icon.svg|TYx-A5YCI|<b>Adaptable</b>|SsbWKZz_Z|Being+an+open-source+project,+it\'s+easy+to+modify+and+adapt+things+to+your+own+needs.<br>|gqdtbKfv7l|jBWaxzt-4|6022814851197600081724ae|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814851197600081724ae/welcome-to-webiny__cost-icon.svg|NLSOIstf9|<b>Low+cost+of+ownership</b>|kI-neIjkXx|Self-hosted+on+top+of+serverless+infrastructure.+No+infrastructure+to+mange,+less+people+required+to+operate+and+maintain.<br>|V14HHGmXN|-djsQadY-8|pTVeVoKkTi|bM5b8O7IMY|<b>Secure</b>|l9PuI-TdVA|Secured+by+AWS+Cognito.+It\'s+also+easy+to+integrate+services+like+OKTA,+Auth0+and+similar.<br>|N1lW0cAasg|W-ub9guhLt|602281486ed41f0008bc2dac|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486ed41f0008bc2dac/welcome-to-webiny__data-icon.svg|DVhLZfrM53|<b>Data+ownership</b>|shmIumNfIu|Webiny+is+self-hosted,+it+means+your+data+stays+within+your+data+center.+<br>|8F7J_16a46|2gtT4Mfw6c|602281486ed41f0008bc2dab|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486ed41f0008bc2dab/welcome-to-webiny__permission-icon.svg|5EMJkVWgKW|<b>Permission+control</b>|cdSOjFAWkf|Powerful+options+to+control+the+permissions+your+users+will+have.+They+perfectly+align+with+your+business+requirements.&nbsp;<br>|5ggqk561Ka|100%25|C6B8QfkUXs|ChF1iOAbtb|7tRfsJ_SEz|Serverless+makes+infrastructure+easy,+</p><p>Webiny+makes+serverless+easy|oYf9t6Uwz|RdazJP-4W1|7jBNW1iTi|60228145f98841000981c721|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228145f98841000981c721/welcome-to-webiny__developer.svg|200px|npNMgLft0|1.+Developer-friendly|DpubDRaGQ|Webiny+has+been+made+with+the+developer+in+mind.+It+helps+them+develop+serverless+applications+with+ease.<br>|KbQocaayR|KDO-Ja7wS|60228145f98841000981c71f|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228145f98841000981c71f/welcome-to-webiny__octo-cat.svg|ETll3nkV4|2.+Open+source|UWPjvO7EC|Webiny+is+created+and+maintained+by+an+amazing+group+of+people.+Being+open+source+means+Webiny+grows+and+evolves+much+faster.+<a+href="https://github.com/webiny/webiny-js/blob/v5/docs/CONTRIBUTING.md">Contributor</a>+are+welcome.<br>|En4soRn06o|fqxeYbEV4|60228148fa244d0008c47c7a|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148fa244d0008c47c7a/welcome-to-webiny__community-icon.png|276px|e5v0LBbfz|3.+Community|p9FWp5yqUy|We+have+an+active+community+on+<a+href="https://webiny.com/slack">slack</a>.+Talk+to+the+core-team,+and+get+help.+Webiny+team+is+always+there+for+any+questions.<br>|OYp5Z-6Xo|woaE-6v5bN|Y8ndbn88hy|View+Webiny+on+GitHub|https://github.com/webiny/webiny-js|secondary|fab|github|<svg+width="16"+viewBox="0+0+496+512"><path+d="M165.9+397.4c0+2-2.3+3.6-5.2+3.6-3.3.3-5.6-1.3-5.6-3.6+0-2+2.3-3.6+5.2-3.6+3-.3+5.6+1.3+5.6+3.6zm-31.1-4.5c-.7+2+1.3+4.3+4.3+4.9+2.6+1+5.6+0+6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2+2.3zm44.2-1.7c-2.9.7-4.9+2.6-4.6+4.9.3+2+2.9+3.3+5.9+2.6+2.9-.7+4.9-2.6+4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8+8C106.1+8+0+113.3+0+252c0+110.9+69.8+205.8+169.5+239.2+12.8+2.3+17.3-5.6+17.3-12.1+0-6.2-.3-40.4-.3-61.4+0+0-70+15-84.7-29.8+0+0-11.4-29.1-27.8-36.6+0+0-22.9-15.7+1.6-15.4+0+0+24.9+2+38.6+25.8+21.9+38.6+58.6+27.5+72.9+20.9+2.3-16+8.8-27.1+16-33.7-55.9-6.2-112.3-14.3-112.3-110.5+0-27.5+7.6-41.3+23.6-58.9-2.6-6.5-11.1-33.3+2.6-67.9+20.9-6.5+69+27+69+27+20-5.6+41.5-8.5+62.8-8.5s42.8+2.9+62.8+8.5c0+0+48.1-33.6+69-27+13.7+34.7+5.2+61.4+2.6+67.9+16+17.7+25.8+31.5+25.8+58.9+0+96.5-58.9+104.2-114.8+110.5+9.2+7.9+17+22.9+17+46.4+0+33.7-.3+75.4-.3+83.6+0+6.5+4.6+14.4+17.3+12.1C428.2+457.8+496+362.9+496+252+496+113.3+383.5+8+244.8+8zM97.2+352.9c-1.3+1-1+3.3.7+5.2+1.6+1.6+3.9+2.3+5.2+1+1.3-1+1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7+1.3.3+2.9+2.3+3.9+1.6+1+3.6.7+4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4+35.6c-1.6+1.3-1+4.3+1.3+6.2+2.3+2.3+5.2+2.6+6.5+1+1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6+1-1.6+3.6+0+5.9+1.6+2.3+4.3+3.3+5.6+2.3+1.6-1.3+1.6-3.9+0-6.2-1.4-2.3-4-3.3-5.6-2z"+fill="currentColor"></path></svg>^C|C|C|6|6|6|6|C|6|3|9|C|C|6|6|C|6|C|C|C|3|C|C|3|C|C|3|C|C|3|C|C|6|C|C|6|3|9|C|C|6|6|C|4|4|4|4|4|4|C|4|4|4|C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|N|H|O|I|P|G|P]|Q|$J|-1|I|M|G|M]]|R|$A|S]|T|$A|U]|V|$A|$W|$X|$0|Y|Z|10]]]]]]|6|@$0|11|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|14|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|1C|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BC]]]|6|@$0|1F|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|1G|Z|1H]|1I|1J]]|6|@]]]]]]|$0|1K|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|1L|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BD]]]|6|@$0|1M|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|1V]|4|$1O|1W]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|1X|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|1Y|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|1Z|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BE]]]|6|@$0|20|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|1V]|4|$1O|24]]|5|$D|$A|$L|F]]|K|$A|$L|F|J|-1|I|25|G|26]|Q|$I|F|G|F|J|-1]]]]|6|@]]]]]]|$0|27|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|2A|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2B|J|-1]|1A|$J|-1|I|F|H|P]|Q|$I|2C]]|K|$A|$L|F]]|12|$1E|BF]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2F|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|2I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|2J|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|2L]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|2M|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2N|J|-1]|1A|$J|-1|I|F]]|K|$A|$L|F]]|12|$1E|BG]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2O|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|2P]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|2Q|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|2R]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|2S|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]|1A|$J|-2]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|2T|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2B|J|-1]|1A|$J|-1|I|F|H|P]]|K|$A|$L|F]]|12|$1E|BH]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2U|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|2V]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|2W|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|2X]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|2Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2N|J|-1]|Q|$J|-1|I|2N|E|F]|1A|$J|-1|I|F]]|K|$A|$L|F]]|12|$1E|BI]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2Z|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|30]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|31|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|32]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]]]|$0|33|2|8|4|$5|$9|$A|$B|34]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|35|H|36|I|P|G|P]]|R|$A|S]|T|$A|U]]]|6|@$0|37|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|38|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|39|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BJ]]]|6|@$0|3A|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|3C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|3D|2|1N|4|$1O|$A|$2|1N|1P|3E|1R|S|1S|3F|1U|3B]|4|$1O|3G]]|5|$D|$A|$L|F|J|-1|E|P]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|3H|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|3I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|G|3K]|1A|$J|-1|G|F]]|12|$1E|BK]]]|6|@$0|3L|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|28|I|F|J|-1]]|12|$15|3M]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|S]|3N|$A|$3O|3P|1U|3Q|9|$L|3R|J|-1|H|3R]]]]]|6|@$0|3S|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BL]]]|6|@$0|3T|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|3U|Z|3V]|1I|3W]|3X|$]]|6|@]]]]|$0|3Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BM]]]|6|@$0|3Z|2|1N|4|$1O|$A|$2|1N|1P|40|1R|I|1S|41|1U|3B]|4|$1O|42]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|43|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|44|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BN]]]|6|@$0|45|2|21|4|$1O|$A|$2|21|1P|22|1R|I|1S|23|1U|3B]|4|$1O|46]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|47|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|P|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|48|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BO]]]|6|@$0|49|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|I|1S|4B|1U|3B]|4|$1O|4C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|4D|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|4E|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BP]]]|6|@$0|4F|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|4H]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|4I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BQ]]]|6|@$0|4J|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|4K]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|4L|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|4M|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BR]]]|6|@$0|4N|2|4O|4|$4P|4Q|5|$D|$A|$L|F|J|-1|E|4R]]|R|$A|U]]|3X|$4S|4T|4U|-1]|2|4V|4W|$0|@4X|4Y]|4Z|50|51|G|9|52]]|6|@]]]]]]]]|$0|53|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$E|F|G|F|H|F|I|F|L|F|J|-1]]|K|$A|$L|F|J|-1|I|3K]|1A|$J|-1|I|F]]|12|$1E|BS]]]|6|@$0|54|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|55|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BT]]]|6|@$0|56|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|57|Z|58]]|3X|$]]|6|@]]]]]]|$0|59|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5A|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BU]]]|6|@$0|5B|2|1N|4|$1O|$A|$2|1N|1P|3E|1R|I|1S|3F|1U|3B]|4|$1O|5C]]|5|$D|$A|$L|F|J|-1]]|K|$A|$L|F]]]]|6|@]]|$0|5D|2|21|4|$1O|$A|$2|21|1P|22|1R|I|1S|23|1U|3B]|4|$1O|5E]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]]]]]]]]]|$0|5F|2|8|4|$5|$9|$A|$B|5G]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|5H|G|P|H|5I|I|P|J|-1]]|R|$A|S]|T|$A|U]|V|$A|$W|$X|$0|5J|Z|5K]]]]]]|6|@$0|5L|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|5M|I|F|J|-1]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5N|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BV]]]|6|@$0|5O|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|5P]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|5Q|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|5R]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5S|2|1D|4|$5|$D|$A|$E|F|G|F|H|3J|I|F|J|-1]]|K|$A|$L|F|J|-1|G|5T]|1A|$I|5T|J|-1]]|12|$1E|BW]]]|6|@$0|5U|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5V|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BX]]]|6|@$0|5W|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|5X|Z|5Y]|1I|5Z]|3X|$]]|6|@]]]]]]|$0|60|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|14|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|61|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BY]]]|6|@$0|62|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|63]]|5|$D|$A|$L|F|J|-1|H|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|64|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|65]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|66|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|5T|G|5T]]|12|$1E|BZ]]]|6|@$0|67|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|68|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C0]]]|6|@$0|69|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6A|Z|6B]|1I|5Z]]|6|@]]]]]]|$0|6C|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6D|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C1]]]|6|@$0|6E|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|6F]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|6G|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|6H]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]|$0|6I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|5T|G|5T]]|12|$1E|C2]]]|6|@$0|6J|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6K|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C3]]]|6|@$0|6L|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6M|Z|6N]|1I|5Z]|3X|$]]|6|@]]]]]]|$0|6O|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6P|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C4]]]|6|@$0|6Q|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|6R]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|6S|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|6T]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]|$0|6U|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|5T]|1A|$G|5T|J|-1]]|12|$1E|C5]]]|6|@$0|6V|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6W|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C6]]]|6|@$0|6X|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6Y|Z|6Z]|1I|5Z]]|6|@]]]]]]|$0|70|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|71|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C7]]]|6|@$0|72|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|73]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|74|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|75]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]]]]]|$0|76|2|8|4|$5|$9|$A|$B|77]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|78|G|P|H|36|I|P|J|-1]]|R|$A|S]|T|$A|U]]]|6|@$0|79|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7A|2|1D|4|$5|$D|$A|$E|F|G|F|H|38|I|F|J|-1]|1A|$J|-1]]|K|$A|$L|F|J|-1|G|3K]|1A|$J|-1|G|F]]|12|$1E|C8]]]|6|@$0|7B|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7C|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C9]]]|6|@$0|7D|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|7E|Z|7F]|9|7G]]|6|@]]]]]]|$0|7H|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CA]]]|6|@$0|7J|2|1N|4|$1O|$A|$2|1N|1P|3E|1R|I|1S|3F|1U|3B]|4|$1O|7K]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|7L|2|21|4|$1O|$A|$2|21|1P|22|1R|I|1S|23|1U|3B]|4|$1O|7M]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]|$0|7N|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|J|-1|I|3K]|1A|$J|-1|I|F]]|12|$1E|CB]]]|6|@$0|7O|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|28|I|F|J|-1]]|12|$15|3M]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]|3N|$A|$3O|3P|1U|7P|9|$J|-1|H|3R]]]]]|6|@$0|7Q|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CC]]]|6|@$0|7R|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|7S|Z|7T]|1I|3W]|3X|$]]|6|@]]]]|$0|7U|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CD]]]|6|@$0|7V|2|1N|4|$1O|$A|$2|1N|1P|40|1R|I|1S|41]|4|$1O|7W]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|7X|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CE]]]|6|@$0|7Z|2|1N|4|$1O|$A|$2|1N|1P|80|1R|I|1S|81|1U|3B]|4|$1O|82]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|83|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|4R|G|F|H|14|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|84|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CF]]]|6|@$0|85|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|I|1S|4B|1U|3B]|4|$1O|86]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|87|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|88|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CG]]]|6|@$0|89|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|8A]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|8B|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CH]]]|6|@$0|8C|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|8D]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|8E|2|4O|4|$4P|8F|5|$D|$A|$L|F|J|-1|E|4R]]|R|$A|U]]|3X|$4S|8G|4U|-1]|2|4V|4W|$0|@4X|4Y]|4Z|8H|51|G|9|52]]|6|@]]]]]]]]|$0|8I|2|8|4|$5|$9|$A|$B|8J]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|38|H|8K|I|P|G|P]]|R|$A|S]|T|$A|U]|V|$A|$W|$X|$0|8L|Z|8M]]]]]]|6|@$0|8N|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|5H|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|8O|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CI]]]|6|@$0|8P|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|8Q]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|8R|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|8S]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|8T|2|1D|4|$5|$D|$A|$E|F|G|F|H|3J|I|F|J|-1]]|K|$A|$L|F|J|-1|G|8U]|1A|$J|-1|G|8U|I|8U]]|12|$1E|CJ]]]|6|@$0|8V|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|8W|Z|8X]|1I|8Y]|3X|$]]|6|@]]|$0|8Z|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|90]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|91|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|92]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|93|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|8U|G|8U]]|12|$1E|CK]]]|6|@$0|94|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|95|Z|96]|1I|8Y]|3X|$]]|6|@]]|$0|97|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|98]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|99|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|9A]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|9B|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|8U]|1A|$J|-1|G|8U]]|12|$1E|CL]]]|6|@$0|9C|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|9D|Z|9E]|1I|8Y]|3X|$]]|6|@]]|$0|9F|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|9G]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|9H|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|9I]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|9J|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|5H|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|8S]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|9K|2|1D|4|$5|$D|$A|$E|F|G|F|H|3J|I|F|J|-1]]|K|$A|$L|F|J|-1|G|8U]|1A|$J|-1|I|8U]]|12|$1E|CM]]]|6|@$0|9L|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6M|Z|6N]|1I|8Y]|3X|$]]|6|@]]|$0|9M|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|9N]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|9O|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|9P]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|9Q|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|8U|G|8U]]|12|$1E|CN]]]|6|@$0|9R|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|9S|Z|9T]|1I|8Y]|3X|$]]|6|@]]|$0|9U|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|9V]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|9W|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23]|4|$1O|9X]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|9Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|8U]|1A|$J|-1|G|8U]]|12|$1E|CO]]]|6|@$0|9Z|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|A0|Z|A1]|1I|8Y]|3X|$]]|6|@]]|$0|A2|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|A3]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|A4|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|A5]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]]]]]|$0|A6|2|8|4|$5|$9|$A|$B|A7]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|N|H|N|I|P|G|P]]|R|$A|S]|T|$A|U]]]|6|@$0|A8|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|A9|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CP]]]|6|@$0|AA|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|AB]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|AC|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|38|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|8S]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|AD|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|G|4R]|1A|$G|4R|J|-1|I|4R]]|12|$1E|CQ]]]|6|@$0|AE|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|AF|Z|AG]|1I|AH]|3X|$]]|6|@]]|$0|AI|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|AJ]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]|$0|AK|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|AL]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|AM|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|4R|G|4R]]|12|$1E|CR]]]|6|@$0|AN|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|AO|Z|AP]|1I|AH]|3X|$]]|6|@]]|$0|AQ|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|AR]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]|$0|AS|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|AT]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|AU|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|4R]]|K|$A|$L|F|J|-1|I|4R]|1A|$J|-1|I|4R|G|4R]]|12|$1E|CS]]]|6|@$0|AV|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|AW|Z|AX]|1I|AH|9|AY]|3X|$]]|6|@]]|$0|AZ|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|B0]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|B1|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|B2]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|B3|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|3J|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|B4|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CT]]]|6|@$0|B5|2|4O|4|$4P|B6|5|$D|$A|$L|F]]|R|$A|S]]|3X|$4S|B7|4U|-1]|2|B8|4W|$0|@B9|BA]|4Z|BB|9|52]]|6|@]]]]]]]]]]'
        },
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:59.947Z",
        editor: "page-builder",
        id: "658c1bd3c39bb10008431b5b#0001",
        locale: "en-US",
        locked: true,
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        path: "/welcome-to-webiny",
        pid: "658c1bd3c39bb10008431b5b",
        publishedOn: "2023-12-27T12:43:00.723Z",
        savedOn: "2023-12-27T12:43:00.723Z",
        settings: {
            general: {
                layout: "static"
            },
            seo: {
                meta: []
            },
            social: {
                meta: []
            }
        },
        status: "published",
        tenant: "root",
        title: "Welcome to Webiny",
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#PB#P#658c1bd3c39bb10008431b5b",
        SK: "REV#0001",
        TYPE: "pb.page",
        _ct: "2023-12-27T12:43:00.864Z",
        _et: "PbPages",
        _md: "2023-12-27T12:43:00.864Z",
        category: "static",
        content: {
            compression: "jsonpack",
            content:
                'id|Fv1PpPWu-|type|document|data|settings|elements|xqt7BI4iN9|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|100px|275px|16px|tablet|horizontalAlignFlex|center|verticalAlign|flex-start|background|image|file|6022814b7a77e60008f70d62|src|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814b7a77e60008f70d62/welcome-to-webiny__hero-block-bg.svg|gdE7Q7rcA|grid|1100px|20px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|_fbQO4Nlpp|cell|size|cdk_pclqE|6022814b0df4b000088735bc|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814b0df4b000088735bc/welcome-to-webiny__webiny-logo.svg|height|44px|ovLRNqyVu3|wmMU13uZ10|1eUZzAvoB|heading|text|typography|heading1|alignment|tag|h1|color|color6|<b>Welcome+to+Webiny</b>|F6ZREnQcc|64px|oEgjDLVXUu|0xYOozhJw|paragraph|paragraph1|div|Webiny+makes+it+easy+to+build+applications+and+websites+on+top+of+the+serverless+infrastructure+by+providing+you+with+a+ready-made+CMS+and+a+development+framework.<br>|20%25|20%25|gwhTOrZvc|30px|6-6|EaIMtHtOIw|-8px|px|602282e07a77e60008f70d63|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602282e07a77e60008f70d63/welcome-to-webiny__hero-feature-card-bg.svg|8k7zxQUTm|heading6|h6|Scalable|qNngQ1C-5|paragraph2|Webiny+apps+can+scale+to+handle+the+most+demanding+workloads.<br>|uBv_VRv0i|8px|iQaW4vjKg|No+custom+tooling+required|Wy3Tw-Lb8|Webiny+eliminates+the+need+to+build+custom+tooling+to+create+serverless+app<br>|uwrjoSZkB|Q39eQZm_8z|zSVZIwnSQ0|Cost+effective|S-Ydr4kX6k|Webiny+apps+run+on+serverless+infrastructure+which+costs+80%25+less+than+VMs<br>|nUX2JXYjhD|8z0hL8l7ay|Resolves+serverless+challenges|04ZNIcAGE_|Webiny+removes+all+the+challenges+of+building+serverless+applications<br>|vm0cFfH8KG|100%25|65px|75px|txeqybzKr3|80px|wMjC2uv8cj|Pm7ws20iA|color3|<b>Get+to+know+Webiny+products</b>|6CPpd558B|heading2|h2|Architect.+Code.+Deploy.|1e0_OJgMx|gpYd80MXeg|40px|15px|kAYc-QClR|4-8|border|style|solid|rgba(229,+229,+229,+1)|1|8i803wClVt|p55J-BkDn|6022814a0df4b000088735bb|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814a0df4b000088735bb/welcome-to-webiny__webiny-serverless-application-framework.svg|90px|link|8nddxG64r|PR-yiR65n|heading3|h3|Webiny+Serverless+</p><p>Application+Framework|pVH9_fFLM|x0SSJvgrdD|b0iE8vr2S|Everything+you+need+to+create+and+deploy+applications+on+top+of+the+serverless+infrastructure.&nbsp;<br>|JMSKwWsT_|OU70Y990tA|T_M_Ww4Wb|heading4|h4|Use+it+to+build:|806nmKOyc|g59JmcyM-7|Cyziie_SK|list|<ul>\n++++++++++++++++++++<li>Full-stack+applications<br></li><li>Multi-tenant+solutions<br></li>\n++++++++++++++++</ul>|ST0O1ZeCk|ILrAABWXiX|<ul>\n++++++++++++++++++++<li>APIs</li><li>Microservice</li>\n++++++++++++++++</ul>|XxXGeIywO|9H5t3COdbo|mc0_RS9rg|button|buttonText|Learn+more|50px|href|https://www.webiny.com/serverless-application-framework/|newTab|primary|icon|fas|long-arrow-alt-right|svg|<svg+width="16"+viewBox="0+0+448+512"><path+d="M313.941+216H12c-6.627+0-12+5.373-12+12v56c0+6.627+5.373+12+12+12h301.941v46.059c0+21.382+25.851+32.09+40.971+16.971l86.059-86.059c9.373-9.373+9.373-24.569+0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971+16.971V216z"+fill="currentColor"></path></svg>|position|16|Kg3rMc1Re|LAcQHMs8K|8oaRz-Gko_|9fQ9W-xiB|6022814891bd1300087bd24c|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814891bd1300087bd24c/welcome-to-webiny__webiny-infrastructure-overview.svg|YCG34DB89|xvBXD_QTkN|GqW2LBMzV|An+easier+way+to+build+serverless+apps|9cWYQwXUd|There+are+many+solutions+that+help+you+run,+deploy+and+monitor+serverless+functions,+but+when+it+comes+to+actually+coding+one,+there+are+none.+Webiny+is+a+solution+that+helps+you+code+your+serverless+app+by+providing+you+with+all+the+components+like+ACL,+routing,+file+storage+and+many+more.<br>|LxqyquKlYy|100%25|60px|177px|60228148f98841000981c723|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148f98841000981c723/welcome-to-webiny__pink-shape.svg|yqrzxoDllE|70px|bD-TQmZyW8|4ESAx7NxM|<b>Framework+features</b>|Xr7NLMpzm|3-3-3-3|_RtRioPOsj|12px|mOr47ImJK|AlTNw-76F8|r0e8MiCuK|6022814bef4a940008b3ba27|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814bef4a940008b3ba27/welcome-to-webiny__security.svg|170px|QFwbqHtSh|DH-C0-mBsO|XSN-oY3V3|<b>Users,+groups,+roles+&amp;+scopes</b>|Unyhp8o-a|Security+is+a+crucial+layer+in+any+application.+Webiny+includes+a+full-featured+security+module+that\'s+connected+to+the+built-in+GraphQL+API.Users,+groups,+roles+&amp;+scopes<br>|Ntcduee0-|0b66dbGkG|PoRqI9i2xE|0ZpnBSqjoz|6022814bef4a940008b3ba26|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814bef4a940008b3ba26/welcome-to-webiny__scaffolding.svg|FFGobMHHI|IWxl_nrRkr|I5btsZceI|<b>Scaffolding</b>|5qvaQSnP6|Quickly+generate+boilerplate+code+using+CLI+plugins.+From+lambda+functions+to+new+GraphQL+APIs.<br>|YHUznp7ZM5|PlxqV_uS7B|zKQYI-EIFl|frRuzWpRI|60228148f98841000981c724|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148f98841000981c724/welcome-to-webiny__idp.svg|M1tvv840H|fwreagGdac|6H1tgEViY|<b>Customizable+security</b>|h0Ctka4TED|Use+the+default+AWS+Cognito,+or+replace+with+3rd+party+identity+providers+like+Okta,+Auth0,+etc.+Using+plugins+you+can+make+Webiny+work+with+any+identity+provider.<br>|SyyrOA60AF|GvU31fd4U|1vAxZAkD9O|dlI-qhVLKy|6022814bef4a940008b3ba28|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814bef4a940008b3ba28/welcome-to-webiny__environments.svg|ftA7NOOxG|WU58SBDPP8|QtYfpt1yoE|<b>Multiple+environments</b>|mmpGUzg6o1|No+code+change+goes+directly+into+a+production+environment.+Webiny+CLI+makes+it+easy+to+manage+and+create+multiple+environments+for+your+project.<br>|wYK9BhaanZ|100%25|125px|ur1DQFl5BR|TzBvXtU2PH|-PU3iBlQ4|A6sNR3MR-5|Xtqk_itss|602281486ed41f0008bc2dad|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486ed41f0008bc2dad/welcome-to-webiny__webiny-serverless-cms.png|495px|bsKTDygik|ev9nhHISRw|1BBr9ACuM|One+size+doesn\'t+fit+all|0olguTqDN|It\'s+a+very+different+set+of+requirements+a+technical+team+has+to+a+marketing+team+to+a+business+development+team.+Webiny+Serverless+CMS+comes+with+several+different+apps+you+can+use+independently,+or+together+as+part+of+a+cohesive+solution.<br>|BhnYb3VW7D|QYZ290WhC|rgba(238,+238,+238,+1)|ER2SFYwbeK|gZp3Hxm5Js|602281486639200009fd35eb|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486639200009fd35eb/welcome-to-webiny__serverless-cms-logo.svg|FsOaMudE8|ElruSYJxWM|Webiny+Serverless+</p><p>CMS|9HJcM89Am|8Cp2ZC30_H|qrS5wswdQ|heading5|h5|A+suite+of+applications+to+help+you+manage+your+content.+|pLUutc-E2|MGlDcu91q_|A6rStUekq|<b>Use+it+to+build:</b>|jIdakfVZU|5JHsGc_Rq-|SNOFqUK6lI|<ul>\n++++++++++++++++++++<li>Marketing+sites</li>\n++++++++++++++++++++<li>Multi-website+solutions</li>\n++++++++++++++++++++<li>Content+hubs<br></li>\n++++++++++++++++</ul>|96dJBnIlc|5cPfb7AwXH|<ul>\n++++++++++++++++++++<li>Multi-language+sites<br></li>\n++++++++++++++++++++<li>Intranet+portals<br></li>\n++++++++++++++++++++<li>Headless+content+models<br></li>\n++++++++++++++++</ul>|L4dFyzBKMM|Learn+more|https://www.webiny.com/serverless-cms/|<svg+width="16"+viewBox="0+0+448+512"><path+d="M313.941+216H12c-6.627+0-12+5.373-12+12v56c0+6.627+5.373+12+12+12h301.941v46.059c0+21.382+25.851+32.09+40.971+16.971l86.059-86.059c9.373-9.373+9.373-24.569+0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971+16.971V216z"+fill="currentColor"></path></svg>|mjmNmloeUS|100%25|220px|602281486639200009fd35ec|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486639200009fd35ec/welcome-to-webiny__cms-benefits-shape.svg|xUkOEAm5X3|Kgr1ambSuG|AP_uTrgLZ|<b>CMS+benefits</b>|juBaAPJ76|4-4-4|s95PSAToXK|35px|ZECp8jcZD|60228148fa244d0008c47c79|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148fa244d0008c47c79/welcome-to-webiny__scalable-icon.svg|146px|EyKog1RmH|<b>Scalable</b>|_8lCcwhUN|No+matter+the+demand,+Webiny+Serverless+CMS+can+easily+scale+to+meet+even+the+most+challenging+workloads.<br>|SmrEQ9OZ8|QWM8cmlQEM|60228145f98841000981c720|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228145f98841000981c720/welcome-to-webiny__adaptable-icon.svg|TYx-A5YCI|<b>Adaptable</b>|SsbWKZz_Z|Being+an+open-source+project,+it\'s+easy+to+modify+and+adapt+things+to+your+own+needs.<br>|gqdtbKfv7l|jBWaxzt-4|6022814851197600081724ae|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814851197600081724ae/welcome-to-webiny__cost-icon.svg|NLSOIstf9|<b>Low+cost+of+ownership</b>|kI-neIjkXx|Self-hosted+on+top+of+serverless+infrastructure.+No+infrastructure+to+mange,+less+people+required+to+operate+and+maintain.<br>|V14HHGmXN|-djsQadY-8|pTVeVoKkTi|bM5b8O7IMY|<b>Secure</b>|l9PuI-TdVA|Secured+by+AWS+Cognito.+It\'s+also+easy+to+integrate+services+like+OKTA,+Auth0+and+similar.<br>|N1lW0cAasg|W-ub9guhLt|602281486ed41f0008bc2dac|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486ed41f0008bc2dac/welcome-to-webiny__data-icon.svg|DVhLZfrM53|<b>Data+ownership</b>|shmIumNfIu|Webiny+is+self-hosted,+it+means+your+data+stays+within+your+data+center.+<br>|8F7J_16a46|2gtT4Mfw6c|602281486ed41f0008bc2dab|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486ed41f0008bc2dab/welcome-to-webiny__permission-icon.svg|5EMJkVWgKW|<b>Permission+control</b>|cdSOjFAWkf|Powerful+options+to+control+the+permissions+your+users+will+have.+They+perfectly+align+with+your+business+requirements.&nbsp;<br>|5ggqk561Ka|100%25|C6B8QfkUXs|ChF1iOAbtb|7tRfsJ_SEz|Serverless+makes+infrastructure+easy,+</p><p>Webiny+makes+serverless+easy|oYf9t6Uwz|RdazJP-4W1|7jBNW1iTi|60228145f98841000981c721|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228145f98841000981c721/welcome-to-webiny__developer.svg|200px|npNMgLft0|1.+Developer-friendly|DpubDRaGQ|Webiny+has+been+made+with+the+developer+in+mind.+It+helps+them+develop+serverless+applications+with+ease.<br>|KbQocaayR|KDO-Ja7wS|60228145f98841000981c71f|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228145f98841000981c71f/welcome-to-webiny__octo-cat.svg|ETll3nkV4|2.+Open+source|UWPjvO7EC|Webiny+is+created+and+maintained+by+an+amazing+group+of+people.+Being+open+source+means+Webiny+grows+and+evolves+much+faster.+<a+href="https://github.com/webiny/webiny-js/blob/v5/docs/CONTRIBUTING.md">Contributor</a>+are+welcome.<br>|En4soRn06o|fqxeYbEV4|60228148fa244d0008c47c7a|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148fa244d0008c47c7a/welcome-to-webiny__community-icon.png|276px|e5v0LBbfz|3.+Community|p9FWp5yqUy|We+have+an+active+community+on+<a+href="https://webiny.com/slack">slack</a>.+Talk+to+the+core-team,+and+get+help.+Webiny+team+is+always+there+for+any+questions.<br>|OYp5Z-6Xo|woaE-6v5bN|Y8ndbn88hy|View+Webiny+on+GitHub|https://github.com/webiny/webiny-js|secondary|fab|github|<svg+width="16"+viewBox="0+0+496+512"><path+d="M165.9+397.4c0+2-2.3+3.6-5.2+3.6-3.3.3-5.6-1.3-5.6-3.6+0-2+2.3-3.6+5.2-3.6+3-.3+5.6+1.3+5.6+3.6zm-31.1-4.5c-.7+2+1.3+4.3+4.3+4.9+2.6+1+5.6+0+6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2+2.3zm44.2-1.7c-2.9.7-4.9+2.6-4.6+4.9.3+2+2.9+3.3+5.9+2.6+2.9-.7+4.9-2.6+4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8+8C106.1+8+0+113.3+0+252c0+110.9+69.8+205.8+169.5+239.2+12.8+2.3+17.3-5.6+17.3-12.1+0-6.2-.3-40.4-.3-61.4+0+0-70+15-84.7-29.8+0+0-11.4-29.1-27.8-36.6+0+0-22.9-15.7+1.6-15.4+0+0+24.9+2+38.6+25.8+21.9+38.6+58.6+27.5+72.9+20.9+2.3-16+8.8-27.1+16-33.7-55.9-6.2-112.3-14.3-112.3-110.5+0-27.5+7.6-41.3+23.6-58.9-2.6-6.5-11.1-33.3+2.6-67.9+20.9-6.5+69+27+69+27+20-5.6+41.5-8.5+62.8-8.5s42.8+2.9+62.8+8.5c0+0+48.1-33.6+69-27+13.7+34.7+5.2+61.4+2.6+67.9+16+17.7+25.8+31.5+25.8+58.9+0+96.5-58.9+104.2-114.8+110.5+9.2+7.9+17+22.9+17+46.4+0+33.7-.3+75.4-.3+83.6+0+6.5+4.6+14.4+17.3+12.1C428.2+457.8+496+362.9+496+252+496+113.3+383.5+8+244.8+8zM97.2+352.9c-1.3+1-1+3.3.7+5.2+1.6+1.6+3.9+2.3+5.2+1+1.3-1+1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7+1.3.3+2.9+2.3+3.9+1.6+1+3.6.7+4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4+35.6c-1.6+1.3-1+4.3+1.3+6.2+2.3+2.3+5.2+2.6+6.5+1+1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6+1-1.6+3.6+0+5.9+1.6+2.3+4.3+3.3+5.6+2.3+1.6-1.3+1.6-3.9+0-6.2-1.4-2.3-4-3.3-5.6-2z"+fill="currentColor"></path></svg>^C|C|C|6|6|6|6|C|6|3|9|C|C|6|6|C|6|C|C|C|3|C|C|3|C|C|3|C|C|3|C|C|6|C|C|6|3|9|C|C|6|6|C|4|4|4|4|4|4|C|4|4|4|C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|N|H|O|I|P|G|P]|Q|$J|-1|I|M|G|M]]|R|$A|S]|T|$A|U]|V|$A|$W|$X|$0|Y|Z|10]]]]]]|6|@$0|11|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|14|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|1C|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BC]]]|6|@$0|1F|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|1G|Z|1H]|1I|1J]]|6|@]]]]]]|$0|1K|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|1L|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BD]]]|6|@$0|1M|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|1V]|4|$1O|1W]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|1X|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|1Y|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|1Z|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BE]]]|6|@$0|20|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|1V]|4|$1O|24]]|5|$D|$A|$L|F]]|K|$A|$L|F|J|-1|I|25|G|26]|Q|$I|F|G|F|J|-1]]]]|6|@]]]]]]|$0|27|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|2A|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2B|J|-1]|1A|$J|-1|I|F|H|P]|Q|$I|2C]]|K|$A|$L|F]]|12|$1E|BF]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2F|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|2I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|2J|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|2L]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|2M|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2N|J|-1]|1A|$J|-1|I|F]]|K|$A|$L|F]]|12|$1E|BG]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2O|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|2P]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|2Q|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|2R]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|2S|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]|1A|$J|-2]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|2T|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2B|J|-1]|1A|$J|-1|I|F|H|P]]|K|$A|$L|F]]|12|$1E|BH]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2U|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|2V]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|2W|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|2X]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|2Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2N|J|-1]|Q|$J|-1|I|2N|E|F]|1A|$J|-1|I|F]]|K|$A|$L|F]]|12|$1E|BI]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2Z|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|30]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|31|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|32]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]]]|$0|33|2|8|4|$5|$9|$A|$B|34]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|35|H|36|I|P|G|P]]|R|$A|S]|T|$A|U]]]|6|@$0|37|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|38|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|39|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BJ]]]|6|@$0|3A|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|3C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|3D|2|1N|4|$1O|$A|$2|1N|1P|3E|1R|S|1S|3F|1U|3B]|4|$1O|3G]]|5|$D|$A|$L|F|J|-1|E|P]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|3H|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|3I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|G|3K]|1A|$J|-1|G|F]]|12|$1E|BK]]]|6|@$0|3L|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|28|I|F|J|-1]]|12|$15|3M]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|S]|3N|$A|$3O|3P|1U|3Q|9|$L|3R|J|-1|H|3R]]]]]|6|@$0|3S|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BL]]]|6|@$0|3T|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|3U|Z|3V]|1I|3W]|3X|$]]|6|@]]]]|$0|3Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BM]]]|6|@$0|3Z|2|1N|4|$1O|$A|$2|1N|1P|40|1R|I|1S|41|1U|3B]|4|$1O|42]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|43|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|44|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BN]]]|6|@$0|45|2|21|4|$1O|$A|$2|21|1P|22|1R|I|1S|23|1U|3B]|4|$1O|46]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|47|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|P|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|48|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BO]]]|6|@$0|49|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|I|1S|4B|1U|3B]|4|$1O|4C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|4D|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|4E|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BP]]]|6|@$0|4F|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|4H]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|4I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BQ]]]|6|@$0|4J|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|4K]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|4L|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|4M|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BR]]]|6|@$0|4N|2|4O|4|$4P|4Q|5|$D|$A|$L|F|J|-1|E|4R]]|R|$A|U]]|3X|$4S|4T|4U|-1]|2|4V|4W|$0|@4X|4Y]|4Z|50|51|G|9|52]]|6|@]]]]]]]]|$0|53|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$E|F|G|F|H|F|I|F|L|F|J|-1]]|K|$A|$L|F|J|-1|I|3K]|1A|$J|-1|I|F]]|12|$1E|BS]]]|6|@$0|54|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|55|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BT]]]|6|@$0|56|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|57|Z|58]]|3X|$]]|6|@]]]]]]|$0|59|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5A|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BU]]]|6|@$0|5B|2|1N|4|$1O|$A|$2|1N|1P|3E|1R|I|1S|3F|1U|3B]|4|$1O|5C]]|5|$D|$A|$L|F|J|-1]]|K|$A|$L|F]]]]|6|@]]|$0|5D|2|21|4|$1O|$A|$2|21|1P|22|1R|I|1S|23|1U|3B]|4|$1O|5E]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]]]]]]]]]|$0|5F|2|8|4|$5|$9|$A|$B|5G]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|5H|G|P|H|5I|I|P|J|-1]]|R|$A|S]|T|$A|U]|V|$A|$W|$X|$0|5J|Z|5K]]]]]]|6|@$0|5L|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|5M|I|F|J|-1]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5N|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BV]]]|6|@$0|5O|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|5P]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|5Q|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|5R]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5S|2|1D|4|$5|$D|$A|$E|F|G|F|H|3J|I|F|J|-1]]|K|$A|$L|F|J|-1|G|5T]|1A|$I|5T|J|-1]]|12|$1E|BW]]]|6|@$0|5U|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5V|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BX]]]|6|@$0|5W|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|5X|Z|5Y]|1I|5Z]|3X|$]]|6|@]]]]]]|$0|60|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|14|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|61|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BY]]]|6|@$0|62|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|63]]|5|$D|$A|$L|F|J|-1|H|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|64|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|65]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|66|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|5T|G|5T]]|12|$1E|BZ]]]|6|@$0|67|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|68|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C0]]]|6|@$0|69|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6A|Z|6B]|1I|5Z]]|6|@]]]]]]|$0|6C|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6D|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C1]]]|6|@$0|6E|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|6F]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|6G|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|6H]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]|$0|6I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|5T|G|5T]]|12|$1E|C2]]]|6|@$0|6J|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6K|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C3]]]|6|@$0|6L|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6M|Z|6N]|1I|5Z]|3X|$]]|6|@]]]]]]|$0|6O|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6P|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C4]]]|6|@$0|6Q|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|6R]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|6S|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|6T]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]|$0|6U|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|5T]|1A|$G|5T|J|-1]]|12|$1E|C5]]]|6|@$0|6V|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6W|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C6]]]|6|@$0|6X|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6Y|Z|6Z]|1I|5Z]]|6|@]]]]]]|$0|70|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|71|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C7]]]|6|@$0|72|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|73]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|74|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|75]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]]]]]|$0|76|2|8|4|$5|$9|$A|$B|77]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|78|G|P|H|36|I|P|J|-1]]|R|$A|S]|T|$A|U]]]|6|@$0|79|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7A|2|1D|4|$5|$D|$A|$E|F|G|F|H|38|I|F|J|-1]|1A|$J|-1]]|K|$A|$L|F|J|-1|G|3K]|1A|$J|-1|G|F]]|12|$1E|C8]]]|6|@$0|7B|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7C|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C9]]]|6|@$0|7D|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|7E|Z|7F]|9|7G]]|6|@]]]]]]|$0|7H|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CA]]]|6|@$0|7J|2|1N|4|$1O|$A|$2|1N|1P|3E|1R|I|1S|3F|1U|3B]|4|$1O|7K]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|7L|2|21|4|$1O|$A|$2|21|1P|22|1R|I|1S|23|1U|3B]|4|$1O|7M]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]|$0|7N|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|J|-1|I|3K]|1A|$J|-1|I|F]]|12|$1E|CB]]]|6|@$0|7O|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|28|I|F|J|-1]]|12|$15|3M]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]|3N|$A|$3O|3P|1U|7P|9|$J|-1|H|3R]]]]]|6|@$0|7Q|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CC]]]|6|@$0|7R|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|7S|Z|7T]|1I|3W]|3X|$]]|6|@]]]]|$0|7U|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CD]]]|6|@$0|7V|2|1N|4|$1O|$A|$2|1N|1P|40|1R|I|1S|41]|4|$1O|7W]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|7X|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CE]]]|6|@$0|7Z|2|1N|4|$1O|$A|$2|1N|1P|80|1R|I|1S|81|1U|3B]|4|$1O|82]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|83|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|4R|G|F|H|14|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|84|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CF]]]|6|@$0|85|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|I|1S|4B|1U|3B]|4|$1O|86]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|87|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|88|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CG]]]|6|@$0|89|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|8A]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|8B|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CH]]]|6|@$0|8C|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|8D]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|8E|2|4O|4|$4P|8F|5|$D|$A|$L|F|J|-1|E|4R]]|R|$A|U]]|3X|$4S|8G|4U|-1]|2|4V|4W|$0|@4X|4Y]|4Z|8H|51|G|9|52]]|6|@]]]]]]]]|$0|8I|2|8|4|$5|$9|$A|$B|8J]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|38|H|8K|I|P|G|P]]|R|$A|S]|T|$A|U]|V|$A|$W|$X|$0|8L|Z|8M]]]]]]|6|@$0|8N|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|5H|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|8O|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CI]]]|6|@$0|8P|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|8Q]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|8R|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|8S]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|8T|2|1D|4|$5|$D|$A|$E|F|G|F|H|3J|I|F|J|-1]]|K|$A|$L|F|J|-1|G|8U]|1A|$J|-1|G|8U|I|8U]]|12|$1E|CJ]]]|6|@$0|8V|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|8W|Z|8X]|1I|8Y]|3X|$]]|6|@]]|$0|8Z|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|90]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|91|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|92]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|93|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|8U|G|8U]]|12|$1E|CK]]]|6|@$0|94|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|95|Z|96]|1I|8Y]|3X|$]]|6|@]]|$0|97|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|98]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|99|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|9A]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|9B|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|8U]|1A|$J|-1|G|8U]]|12|$1E|CL]]]|6|@$0|9C|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|9D|Z|9E]|1I|8Y]|3X|$]]|6|@]]|$0|9F|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|9G]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|9H|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|9I]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|9J|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|5H|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|8S]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|9K|2|1D|4|$5|$D|$A|$E|F|G|F|H|3J|I|F|J|-1]]|K|$A|$L|F|J|-1|G|8U]|1A|$J|-1|I|8U]]|12|$1E|CM]]]|6|@$0|9L|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6M|Z|6N]|1I|8Y]|3X|$]]|6|@]]|$0|9M|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|9N]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|9O|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|9P]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|9Q|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|8U|G|8U]]|12|$1E|CN]]]|6|@$0|9R|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|9S|Z|9T]|1I|8Y]|3X|$]]|6|@]]|$0|9U|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|9V]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|9W|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23]|4|$1O|9X]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|9Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|8U]|1A|$J|-1|G|8U]]|12|$1E|CO]]]|6|@$0|9Z|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|A0|Z|A1]|1I|8Y]|3X|$]]|6|@]]|$0|A2|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|A3]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|A4|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|A5]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]]]]]|$0|A6|2|8|4|$5|$9|$A|$B|A7]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|N|H|N|I|P|G|P]]|R|$A|S]|T|$A|U]]]|6|@$0|A8|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|A9|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CP]]]|6|@$0|AA|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|AB]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|AC|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|38|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|8S]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|AD|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|G|4R]|1A|$G|4R|J|-1|I|4R]]|12|$1E|CQ]]]|6|@$0|AE|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|AF|Z|AG]|1I|AH]|3X|$]]|6|@]]|$0|AI|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|AJ]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]|$0|AK|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|AL]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|AM|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|4R|G|4R]]|12|$1E|CR]]]|6|@$0|AN|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|AO|Z|AP]|1I|AH]|3X|$]]|6|@]]|$0|AQ|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|AR]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]|$0|AS|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|AT]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|AU|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|4R]]|K|$A|$L|F|J|-1|I|4R]|1A|$J|-1|I|4R|G|4R]]|12|$1E|CS]]]|6|@$0|AV|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|AW|Z|AX]|1I|AH|9|AY]|3X|$]]|6|@]]|$0|AZ|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|B0]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|B1|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|B2]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|B3|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|3J|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|B4|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CT]]]|6|@$0|B5|2|4O|4|$4P|B6|5|$D|$A|$L|F]]|R|$A|S]]|3X|$4S|B7|4U|-1]|2|B8|4W|$0|@B9|BA]|4Z|BB|9|52]]|6|@]]]]]]]]]]'
        },
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:59.947Z",
        editor: "page-builder",
        id: "658c1bd3c39bb10008431b5b#0001",
        locale: "en-US",
        locked: true,
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        path: "/welcome-to-webiny",
        pid: "658c1bd3c39bb10008431b5b",
        publishedOn: "2023-12-27T12:43:00.723Z",
        savedOn: "2023-12-27T12:43:00.723Z",
        settings: {
            general: {
                layout: "static"
            },
            seo: {
                meta: []
            },
            social: {
                meta: []
            }
        },
        status: "published",
        tenant: "root",
        title: "Welcome to Webiny",
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        GSI1_PK: "T#root",
        GSI1_SK: "TYPE#group#IDENTITY#658c1b73c39bb10008431b44",
        PK: "IDENTITY#658c1b73c39bb10008431b44",
        SK: "LINK#T#root",
        _ct: "2023-12-27T12:41:24.428Z",
        _et: "SecurityIdentity2Tenant",
        _md: "2023-12-27T12:41:24.428Z",
        createdOn: "2023-12-27T12:41:24.428Z",
        data: {
            groups: [
                {
                    id: "658c1b60c39bb10008431b42",
                    permissions: [
                        {
                            name: "*"
                        }
                    ]
                }
            ],
            teams: []
        },
        identity: "658c1b73c39bb10008431b44",
        tenant: "root",
        type: "group",
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814bef4a940008b3ba26",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.041Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814bef4a940008b3ba26",
        id: "6022814bef4a940008b3ba26#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.041Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 33888,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/6022814bef4a940008b3ba26/welcome-to-webiny__scaffolding.svg",
            "text@name": "scaffolding.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814bef4a940008b3ba26",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.023Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814bef4a940008b3ba26",
        id: "6022814bef4a940008b3ba26#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.023Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 33888,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/6022814bef4a940008b3ba26/welcome-to-webiny__scaffolding.svg",
            "text@name": "scaffolding.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        GSI1_PK: "T#root#PS#RENDER",
        GSI1_SK: "/not-found",
        PK: "T#root#PS#RENDER#/not-found",
        SK: "A",
        TYPE: "ps.render",
        _ct: "2023-12-27T12:43:23.802Z",
        _et: "PrerenderingServiceRender",
        _md: "2023-12-27T12:43:23.802Z",
        data: {
            files: [
                {
                    meta: {
                        tags: [
                            {
                                key: "pb-page",
                                value: "658c1bd3c39bb10008431b5c#0001"
                            },
                            {
                                key: "pb-menu",
                                value: "main-menu"
                            }
                        ]
                    },
                    name: "index.html",
                    type: "text/html"
                },
                {
                    meta: {},
                    name: "graphql.json",
                    type: "application/json"
                }
            ],
            locale: "en-US",
            path: "/not-found",
            tags: [
                {
                    key: "notFoundPage",
                    value: true
                }
            ],
            tenant: "root"
        }
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814851197600081724ae",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.122Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814851197600081724ae",
        id: "6022814851197600081724ae#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.122Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 60602,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/6022814851197600081724ae/welcome-to-webiny__cost-icon.svg",
            "text@name": "cost-icon.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814851197600081724ae",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.121Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814851197600081724ae",
        id: "6022814851197600081724ae#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.121Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 60602,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/6022814851197600081724ae/welcome-to-webiny__cost-icon.svg",
            "text@name": "cost-icon.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CMG",
        SK: "658c1bcbc39bb10008431b45",
        TYPE: "cms.group",
        _ct: "2023-12-27T12:42:51.962Z",
        _et: "CmsGroups",
        _md: "2023-12-27T12:42:51.962Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:51.921Z",
        description: "A generic content model group",
        icon: "fas/star",
        id: "658c1bcbc39bb10008431b45",
        locale: "en-US",
        name: "Ungrouped",
        savedOn: "2023-12-27T12:42:51.921Z",
        slug: "ungrouped",
        tenant: "root",
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814a0df4b000088735bb",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:58.964Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814a0df4b000088735bb",
        id: "6022814a0df4b000088735bb#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:58.964Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 3661,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/6022814a0df4b000088735bb/welcome-to-webiny__webiny-serverless-application-framework.svg",
            "text@name": "webiny-serverless-application-framework.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814a0df4b000088735bb",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:58.964Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814a0df4b000088735bb",
        id: "6022814a0df4b000088735bb#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:58.964Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 3661,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/6022814a0df4b000088735bb/welcome-to-webiny__webiny-serverless-application-framework.svg",
            "text@name": "webiny-serverless-application-framework.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        GSI1_PK: "T#root#PS#RENDER",
        GSI1_SK: "/welcome-to-webiny",
        PK: "T#root#PS#RENDER#/welcome-to-webiny",
        SK: "A",
        TYPE: "ps.render",
        _ct: "2023-12-27T12:43:14.831Z",
        _et: "PrerenderingServiceRender",
        _md: "2023-12-27T12:43:14.832Z",
        data: {
            files: [
                {
                    meta: {
                        tags: [
                            {
                                key: "pb-page",
                                value: "658c1bd3c39bb10008431b5b#0001"
                            },
                            {
                                key: "pb-menu",
                                value: "main-menu"
                            }
                        ]
                    },
                    name: "index.html",
                    type: "text/html"
                },
                {
                    meta: {},
                    name: "graphql.json",
                    type: "application/json"
                }
            ],
            locale: "en-US",
            path: "/welcome-to-webiny",
            tenant: "root"
        }
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c248b6607be00087f1166",
        SK: "L",
        created: "2023-12-27T13:20:12.835Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:20:11.821Z",
        entity: "CmsEntries",
        entryId: "658c248b6607be00087f1166",
        firstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        firstPublishedOn: "2023-12-27T13:20:12.775Z",
        id: "658c248b6607be00087f1166#0001",
        lastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        lastPublishedOn: "2023-12-27T13:20:12.775Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        modelId: "modelA",
        modified: "2023-12-27T13:20:12.835Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        publishedOn: "2023-12-27T13:20:12.775Z",
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:20:11.821Z",
        revisionFirstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionFirstPublishedOn: "2023-12-27T13:20:12.775Z",
        revisionLastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionLastPublishedOn: "2023-12-27T13:20:12.775Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:20:12.775Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:20:12.775Z",
        status: "published",
        tenant: "root",
        values: {
            "long-text@z2tdm05d": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBUcM0rKapUMAQArKdlkBgAAAA="
            },
            "text@f2qcuuzs": "DDB+ES - Model A Entry 1"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c248b6607be00087f1166",
        SK: "P",
        TYPE: "cms.entry.p",
        created: "2023-12-27T13:20:12.803Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:20:11.821Z",
        entity: "CmsEntries",
        entryId: "658c248b6607be00087f1166",
        firstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        firstPublishedOn: "2023-12-27T13:20:12.775Z",
        id: "658c248b6607be00087f1166#0001",
        lastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        lastPublishedOn: "2023-12-27T13:20:12.775Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        modelId: "modelA",
        modified: "2023-12-27T13:20:12.803Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        publishedOn: "2023-12-27T13:20:12.775Z",
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:20:11.821Z",
        revisionFirstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionFirstPublishedOn: "2023-12-27T13:20:12.775Z",
        revisionLastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionLastPublishedOn: "2023-12-27T13:20:12.775Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:20:12.775Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:20:12.775Z",
        status: "published",
        tenant: "root",
        values: {
            "long-text@z2tdm05d": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBUcM0rKapUMAQArKdlkBgAAAA="
            },
            "text@f2qcuuzs": "DDB+ES - Model A Entry 1"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c248b6607be00087f1166",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T13:20:12.803Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:20:11.821Z",
        entity: "CmsEntries",
        entryId: "658c248b6607be00087f1166",
        firstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        firstPublishedOn: "2023-12-27T13:20:12.775Z",
        id: "658c248b6607be00087f1166#0001",
        lastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        lastPublishedOn: "2023-12-27T13:20:12.775Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        modelId: "modelA",
        modified: "2023-12-27T13:20:12.803Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        publishedOn: "2023-12-27T13:20:12.775Z",
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:20:11.821Z",
        revisionFirstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionFirstPublishedOn: "2023-12-27T13:20:12.775Z",
        revisionLastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionLastPublishedOn: "2023-12-27T13:20:12.775Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:20:12.775Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:20:12.775Z",
        status: "published",
        tenant: "root",
        values: {
            "long-text@z2tdm05d": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBUcM0rKapUMAQArKdlkBgAAAA="
            },
            "text@f2qcuuzs": "DDB+ES - Model A Entry 1"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228148f98841000981c723",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.004Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228148f98841000981c723",
        id: "60228148f98841000981c723#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.004Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 390,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228148f98841000981c723/welcome-to-webiny__pink-shape.svg",
            "text@name": "pink-shape.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228148f98841000981c723",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.004Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228148f98841000981c723",
        id: "60228148f98841000981c723#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.004Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 390,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228148f98841000981c723/welcome-to-webiny__pink-shape.svg",
            "text@name": "pink-shape.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#602281486639200009fd35eb",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.065Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "602281486639200009fd35eb",
        id: "602281486639200009fd35eb#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.065Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 1758,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/602281486639200009fd35eb/welcome-to-webiny__serverless-cms-logo.svg",
            "text@name": "serverless-cms-logo.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#602281486639200009fd35eb",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.065Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "602281486639200009fd35eb",
        id: "602281486639200009fd35eb#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.065Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 1758,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/602281486639200009fd35eb/welcome-to-webiny__serverless-cms-logo.svg",
            "text@name": "serverless-cms-logo.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814891bd1300087bd24c",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:58.984Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814891bd1300087bd24c",
        id: "6022814891bd1300087bd24c#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:58.984Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 90163,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/6022814891bd1300087bd24c/welcome-to-webiny__webiny-infrastructure-overview.svg",
            "text@name": "webiny-infrastructure-overview.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814891bd1300087bd24c",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:58.984Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814891bd1300087bd24c",
        id: "6022814891bd1300087bd24c#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:58.984Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 90163,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/6022814891bd1300087bd24c/welcome-to-webiny__webiny-infrastructure-overview.svg",
            "text@name": "webiny-infrastructure-overview.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228145f98841000981c71f",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.281Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228145f98841000981c71f",
        id: "60228145f98841000981c71f#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.281Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 30007,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228145f98841000981c71f/welcome-to-webiny__octo-cat.svg",
            "text@name": "octo-cat.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228145f98841000981c71f",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.281Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228145f98841000981c71f",
        id: "60228145f98841000981c71f#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.281Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 30007,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228145f98841000981c71f/welcome-to-webiny__octo-cat.svg",
            "text@name": "octo-cat.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#602281486639200009fd35ec",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.081Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "602281486639200009fd35ec",
        id: "602281486639200009fd35ec#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.081Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 392,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/602281486639200009fd35ec/welcome-to-webiny__cms-benefits-shape.svg",
            "text@name": "cms-benefits-shape.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#602281486639200009fd35ec",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.068Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "602281486639200009fd35ec",
        id: "602281486639200009fd35ec#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.068Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 392,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/602281486639200009fd35ec/welcome-to-webiny__cms-benefits-shape.svg",
            "text@name": "cms-benefits-shape.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        GSI1_PK: "T#root#PS#TAG",
        GSI1_SK: "pb-page#658c1bd3c39bb10008431b5c#0001#/not-found",
        PK: "T#root#PS#TAG#pb-page#658c1bd3c39bb10008431b5c#0001#/not-found",
        SK: "658c1bd3c39bb10008431b5c#0001#/not-found",
        TYPE: "ps.tagPathLink",
        _ct: "2023-12-27T12:43:23.860Z",
        _et: "PrerenderingServiceTagPathLink",
        _md: "2023-12-27T12:43:23.860Z",
        data: {
            key: "pb-page",
            path: "/not-found",
            tenant: "root",
            value: "658c1bd3c39bb10008431b5c#0001"
        }
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c2524adbc1700090e1ad1",
        SK: "L",
        created: "2023-12-27T13:22:46.130Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:22:44.672Z",
        entity: "CmsEntries",
        entryId: "658c2524adbc1700090e1ad1",
        firstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        firstPublishedOn: "2023-12-27T13:22:46.091Z",
        id: "658c2524adbc1700090e1ad1#0001",
        lastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        lastPublishedOn: "2023-12-27T13:22:46.091Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        modelId: "modelB",
        modified: "2023-12-27T13:22:46.130Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        publishedOn: "2023-12-27T13:22:46.091Z",
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:22:44.672Z",
        revisionFirstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionFirstPublishedOn: "2023-12-27T13:22:46.091Z",
        revisionLastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionLastPublishedOn: "2023-12-27T13:22:46.091Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:22:46.091Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:22:46.091Z",
        status: "published",
        tenant: "root",
        values: {
            "long-text@7c5t8wwa": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBScM0rKapUMAQAaZvoqRgAAAA="
            },
            "text@4dep2w2h": "DDB+ES - Model B Entry 1"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c2524adbc1700090e1ad1",
        SK: "P",
        TYPE: "cms.entry.p",
        created: "2023-12-27T13:22:46.115Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:22:44.672Z",
        entity: "CmsEntries",
        entryId: "658c2524adbc1700090e1ad1",
        firstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        firstPublishedOn: "2023-12-27T13:22:46.091Z",
        id: "658c2524adbc1700090e1ad1#0001",
        lastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        lastPublishedOn: "2023-12-27T13:22:46.091Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        modelId: "modelB",
        modified: "2023-12-27T13:22:46.115Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        publishedOn: "2023-12-27T13:22:46.091Z",
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:22:44.672Z",
        revisionFirstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionFirstPublishedOn: "2023-12-27T13:22:46.091Z",
        revisionLastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionLastPublishedOn: "2023-12-27T13:22:46.091Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:22:46.091Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:22:46.091Z",
        status: "published",
        tenant: "root",
        values: {
            "long-text@7c5t8wwa": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBScM0rKapUMAQAaZvoqRgAAAA="
            },
            "text@4dep2w2h": "DDB+ES - Model B Entry 1"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c2524adbc1700090e1ad1",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T13:22:46.114Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:22:44.672Z",
        entity: "CmsEntries",
        entryId: "658c2524adbc1700090e1ad1",
        firstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        firstPublishedOn: "2023-12-27T13:22:46.091Z",
        id: "658c2524adbc1700090e1ad1#0001",
        lastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        lastPublishedOn: "2023-12-27T13:22:46.091Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        modelId: "modelB",
        modified: "2023-12-27T13:22:46.114Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        publishedOn: "2023-12-27T13:22:46.091Z",
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:22:44.672Z",
        revisionFirstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionFirstPublishedOn: "2023-12-27T13:22:46.091Z",
        revisionLastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionLastPublishedOn: "2023-12-27T13:22:46.091Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:22:46.091Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:22:46.091Z",
        status: "published",
        tenant: "root",
        values: {
            "long-text@7c5t8wwa": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBScM0rKapUMAQAaZvoqRgAAAA="
            },
            "text@4dep2w2h": "DDB+ES - Model B Entry 1"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228148fa244d0008c47c79",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.102Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228148fa244d0008c47c79",
        id: "60228148fa244d0008c47c79#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.102Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 7806,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228148fa244d0008c47c79/welcome-to-webiny__scalable-icon.svg",
            "text@name": "scalable-icon.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228148fa244d0008c47c79",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.101Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228148fa244d0008c47c79",
        id: "60228148fa244d0008c47c79#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.101Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 7806,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228148fa244d0008c47c79/welcome-to-webiny__scalable-icon.svg",
            "text@name": "scalable-icon.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228148f98841000981c724",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.146Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228148f98841000981c724",
        id: "60228148f98841000981c724#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.146Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 27878,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228148f98841000981c724/welcome-to-webiny__idp.svg",
            "text@name": "idp.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228148f98841000981c724",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.146Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228148f98841000981c724",
        id: "60228148f98841000981c724#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.146Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 27878,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228148f98841000981c724/welcome-to-webiny__idp.svg",
            "text@name": "idp.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        GSI1_PK: "T#root#PS#TAG",
        GSI1_SK: "pb-page#658c1bd3c39bb10008431b5b#0001#/",
        PK: "T#root#PS#TAG#pb-page#658c1bd3c39bb10008431b5b#0001#/",
        SK: "658c1bd3c39bb10008431b5b#0001#/",
        TYPE: "ps.tagPathLink",
        _ct: "2023-12-27T12:43:19.484Z",
        _et: "PrerenderingServiceTagPathLink",
        _md: "2023-12-27T12:43:19.484Z",
        data: {
            key: "pb-page",
            path: "/",
            tenant: "root",
            value: "658c1bd3c39bb10008431b5b#0001"
        }
    },
    {
        PK: "T#root#I18N#L",
        SK: "en-US",
        _ct: "2023-12-27T12:42:49.523Z",
        _et: "I18NLocale",
        _md: "2023-12-27T12:42:49.523Z",
        code: "en-US",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:48.245Z",
        default: true,
        tenant: "root",
        webinyVersion: "5.38.2"
    },
    {
        PK: "ADMIN#SETTINGS",
        SK: "default",
        data: {
            appUrl: "https://d3hohw12noi930.cloudfront.net"
        }
    },
    {
        PK: "T#root#L#en-US#PB#PATH",
        SK: "/not-found",
        TYPE: "pb.page.p.path",
        _ct: "2023-12-27T12:43:00.682Z",
        _et: "PbPages",
        _md: "2023-12-27T12:43:00.682Z",
        category: "static",
        content: {
            compression: "jsonpack",
            content:
                "id|h0HqpItbGT|type|document|data|settings|elements|ZlkwCyXhhc|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|pwR8zBN28v|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|6838kMd5Vh|cell|80px|size|iG8DLRffpF|heading|text|typography|heading1|alignment|tag|h1|color|color3|Page+not+found!|9UHkb1nlN1|paragraph|paragraph1|div|Sorry,+but+the+page+you+were+looking+for+could+not+be+found.|PkNZ6zIVWv|button|buttonText|TAKE+ME+HOme|30px|link|href|/|primary^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|J|-1|E|13]]|S|$14|1U]]]|6|@$0|15|2|16|4|$17|$A|$2|16|18|19|1A|O|1B|1C|1D|1E]|4|$17|1F]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|1G|2|1H|4|$17|$A|$2|1H|18|1I|1A|O|1B|1J|1D|1E]|4|$17|1K]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|1L|2|1M|4|$1N|1O|5|$D|$A|$L|F|J|-1|E|1P]]|N|$A|O]]|1Q|$1R|1S]|2|1T]|6|@]]]]]]]]]]"
        },
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:59.964Z",
        editor: "page-builder",
        id: "658c1bd3c39bb10008431b5c#0001",
        locale: "en-US",
        locked: true,
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        path: "/not-found",
        pid: "658c1bd3c39bb10008431b5c",
        publishedOn: "2023-12-27T12:43:00.663Z",
        savedOn: "2023-12-27T12:43:00.663Z",
        settings: {
            general: {
                layout: "static"
            },
            seo: {
                meta: []
            },
            social: {
                meta: []
            }
        },
        status: "published",
        tenant: "root",
        title: "Not Found",
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#PB#PATH",
        SK: "/welcome-to-webiny",
        TYPE: "pb.page.p.path",
        _ct: "2023-12-27T12:43:00.881Z",
        _et: "PbPages",
        _md: "2023-12-27T12:43:00.881Z",
        category: "static",
        content: {
            compression: "jsonpack",
            content:
                'id|Fv1PpPWu-|type|document|data|settings|elements|xqt7BI4iN9|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|100px|275px|16px|tablet|horizontalAlignFlex|center|verticalAlign|flex-start|background|image|file|6022814b7a77e60008f70d62|src|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814b7a77e60008f70d62/welcome-to-webiny__hero-block-bg.svg|gdE7Q7rcA|grid|1100px|20px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|_fbQO4Nlpp|cell|size|cdk_pclqE|6022814b0df4b000088735bc|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814b0df4b000088735bc/welcome-to-webiny__webiny-logo.svg|height|44px|ovLRNqyVu3|wmMU13uZ10|1eUZzAvoB|heading|text|typography|heading1|alignment|tag|h1|color|color6|<b>Welcome+to+Webiny</b>|F6ZREnQcc|64px|oEgjDLVXUu|0xYOozhJw|paragraph|paragraph1|div|Webiny+makes+it+easy+to+build+applications+and+websites+on+top+of+the+serverless+infrastructure+by+providing+you+with+a+ready-made+CMS+and+a+development+framework.<br>|20%25|20%25|gwhTOrZvc|30px|6-6|EaIMtHtOIw|-8px|px|602282e07a77e60008f70d63|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602282e07a77e60008f70d63/welcome-to-webiny__hero-feature-card-bg.svg|8k7zxQUTm|heading6|h6|Scalable|qNngQ1C-5|paragraph2|Webiny+apps+can+scale+to+handle+the+most+demanding+workloads.<br>|uBv_VRv0i|8px|iQaW4vjKg|No+custom+tooling+required|Wy3Tw-Lb8|Webiny+eliminates+the+need+to+build+custom+tooling+to+create+serverless+app<br>|uwrjoSZkB|Q39eQZm_8z|zSVZIwnSQ0|Cost+effective|S-Ydr4kX6k|Webiny+apps+run+on+serverless+infrastructure+which+costs+80%25+less+than+VMs<br>|nUX2JXYjhD|8z0hL8l7ay|Resolves+serverless+challenges|04ZNIcAGE_|Webiny+removes+all+the+challenges+of+building+serverless+applications<br>|vm0cFfH8KG|100%25|65px|75px|txeqybzKr3|80px|wMjC2uv8cj|Pm7ws20iA|color3|<b>Get+to+know+Webiny+products</b>|6CPpd558B|heading2|h2|Architect.+Code.+Deploy.|1e0_OJgMx|gpYd80MXeg|40px|15px|kAYc-QClR|4-8|border|style|solid|rgba(229,+229,+229,+1)|1|8i803wClVt|p55J-BkDn|6022814a0df4b000088735bb|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814a0df4b000088735bb/welcome-to-webiny__webiny-serverless-application-framework.svg|90px|link|8nddxG64r|PR-yiR65n|heading3|h3|Webiny+Serverless+</p><p>Application+Framework|pVH9_fFLM|x0SSJvgrdD|b0iE8vr2S|Everything+you+need+to+create+and+deploy+applications+on+top+of+the+serverless+infrastructure.&nbsp;<br>|JMSKwWsT_|OU70Y990tA|T_M_Ww4Wb|heading4|h4|Use+it+to+build:|806nmKOyc|g59JmcyM-7|Cyziie_SK|list|<ul>\n++++++++++++++++++++<li>Full-stack+applications<br></li><li>Multi-tenant+solutions<br></li>\n++++++++++++++++</ul>|ST0O1ZeCk|ILrAABWXiX|<ul>\n++++++++++++++++++++<li>APIs</li><li>Microservice</li>\n++++++++++++++++</ul>|XxXGeIywO|9H5t3COdbo|mc0_RS9rg|button|buttonText|Learn+more|50px|href|https://www.webiny.com/serverless-application-framework/|newTab|primary|icon|fas|long-arrow-alt-right|svg|<svg+width="16"+viewBox="0+0+448+512"><path+d="M313.941+216H12c-6.627+0-12+5.373-12+12v56c0+6.627+5.373+12+12+12h301.941v46.059c0+21.382+25.851+32.09+40.971+16.971l86.059-86.059c9.373-9.373+9.373-24.569+0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971+16.971V216z"+fill="currentColor"></path></svg>|position|16|Kg3rMc1Re|LAcQHMs8K|8oaRz-Gko_|9fQ9W-xiB|6022814891bd1300087bd24c|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814891bd1300087bd24c/welcome-to-webiny__webiny-infrastructure-overview.svg|YCG34DB89|xvBXD_QTkN|GqW2LBMzV|An+easier+way+to+build+serverless+apps|9cWYQwXUd|There+are+many+solutions+that+help+you+run,+deploy+and+monitor+serverless+functions,+but+when+it+comes+to+actually+coding+one,+there+are+none.+Webiny+is+a+solution+that+helps+you+code+your+serverless+app+by+providing+you+with+all+the+components+like+ACL,+routing,+file+storage+and+many+more.<br>|LxqyquKlYy|100%25|60px|177px|60228148f98841000981c723|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148f98841000981c723/welcome-to-webiny__pink-shape.svg|yqrzxoDllE|70px|bD-TQmZyW8|4ESAx7NxM|<b>Framework+features</b>|Xr7NLMpzm|3-3-3-3|_RtRioPOsj|12px|mOr47ImJK|AlTNw-76F8|r0e8MiCuK|6022814bef4a940008b3ba27|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814bef4a940008b3ba27/welcome-to-webiny__security.svg|170px|QFwbqHtSh|DH-C0-mBsO|XSN-oY3V3|<b>Users,+groups,+roles+&amp;+scopes</b>|Unyhp8o-a|Security+is+a+crucial+layer+in+any+application.+Webiny+includes+a+full-featured+security+module+that\'s+connected+to+the+built-in+GraphQL+API.Users,+groups,+roles+&amp;+scopes<br>|Ntcduee0-|0b66dbGkG|PoRqI9i2xE|0ZpnBSqjoz|6022814bef4a940008b3ba26|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814bef4a940008b3ba26/welcome-to-webiny__scaffolding.svg|FFGobMHHI|IWxl_nrRkr|I5btsZceI|<b>Scaffolding</b>|5qvaQSnP6|Quickly+generate+boilerplate+code+using+CLI+plugins.+From+lambda+functions+to+new+GraphQL+APIs.<br>|YHUznp7ZM5|PlxqV_uS7B|zKQYI-EIFl|frRuzWpRI|60228148f98841000981c724|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148f98841000981c724/welcome-to-webiny__idp.svg|M1tvv840H|fwreagGdac|6H1tgEViY|<b>Customizable+security</b>|h0Ctka4TED|Use+the+default+AWS+Cognito,+or+replace+with+3rd+party+identity+providers+like+Okta,+Auth0,+etc.+Using+plugins+you+can+make+Webiny+work+with+any+identity+provider.<br>|SyyrOA60AF|GvU31fd4U|1vAxZAkD9O|dlI-qhVLKy|6022814bef4a940008b3ba28|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814bef4a940008b3ba28/welcome-to-webiny__environments.svg|ftA7NOOxG|WU58SBDPP8|QtYfpt1yoE|<b>Multiple+environments</b>|mmpGUzg6o1|No+code+change+goes+directly+into+a+production+environment.+Webiny+CLI+makes+it+easy+to+manage+and+create+multiple+environments+for+your+project.<br>|wYK9BhaanZ|100%25|125px|ur1DQFl5BR|TzBvXtU2PH|-PU3iBlQ4|A6sNR3MR-5|Xtqk_itss|602281486ed41f0008bc2dad|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486ed41f0008bc2dad/welcome-to-webiny__webiny-serverless-cms.png|495px|bsKTDygik|ev9nhHISRw|1BBr9ACuM|One+size+doesn\'t+fit+all|0olguTqDN|It\'s+a+very+different+set+of+requirements+a+technical+team+has+to+a+marketing+team+to+a+business+development+team.+Webiny+Serverless+CMS+comes+with+several+different+apps+you+can+use+independently,+or+together+as+part+of+a+cohesive+solution.<br>|BhnYb3VW7D|QYZ290WhC|rgba(238,+238,+238,+1)|ER2SFYwbeK|gZp3Hxm5Js|602281486639200009fd35eb|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486639200009fd35eb/welcome-to-webiny__serverless-cms-logo.svg|FsOaMudE8|ElruSYJxWM|Webiny+Serverless+</p><p>CMS|9HJcM89Am|8Cp2ZC30_H|qrS5wswdQ|heading5|h5|A+suite+of+applications+to+help+you+manage+your+content.+|pLUutc-E2|MGlDcu91q_|A6rStUekq|<b>Use+it+to+build:</b>|jIdakfVZU|5JHsGc_Rq-|SNOFqUK6lI|<ul>\n++++++++++++++++++++<li>Marketing+sites</li>\n++++++++++++++++++++<li>Multi-website+solutions</li>\n++++++++++++++++++++<li>Content+hubs<br></li>\n++++++++++++++++</ul>|96dJBnIlc|5cPfb7AwXH|<ul>\n++++++++++++++++++++<li>Multi-language+sites<br></li>\n++++++++++++++++++++<li>Intranet+portals<br></li>\n++++++++++++++++++++<li>Headless+content+models<br></li>\n++++++++++++++++</ul>|L4dFyzBKMM|Learn+more|https://www.webiny.com/serverless-cms/|<svg+width="16"+viewBox="0+0+448+512"><path+d="M313.941+216H12c-6.627+0-12+5.373-12+12v56c0+6.627+5.373+12+12+12h301.941v46.059c0+21.382+25.851+32.09+40.971+16.971l86.059-86.059c9.373-9.373+9.373-24.569+0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971+16.971V216z"+fill="currentColor"></path></svg>|mjmNmloeUS|100%25|220px|602281486639200009fd35ec|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486639200009fd35ec/welcome-to-webiny__cms-benefits-shape.svg|xUkOEAm5X3|Kgr1ambSuG|AP_uTrgLZ|<b>CMS+benefits</b>|juBaAPJ76|4-4-4|s95PSAToXK|35px|ZECp8jcZD|60228148fa244d0008c47c79|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148fa244d0008c47c79/welcome-to-webiny__scalable-icon.svg|146px|EyKog1RmH|<b>Scalable</b>|_8lCcwhUN|No+matter+the+demand,+Webiny+Serverless+CMS+can+easily+scale+to+meet+even+the+most+challenging+workloads.<br>|SmrEQ9OZ8|QWM8cmlQEM|60228145f98841000981c720|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228145f98841000981c720/welcome-to-webiny__adaptable-icon.svg|TYx-A5YCI|<b>Adaptable</b>|SsbWKZz_Z|Being+an+open-source+project,+it\'s+easy+to+modify+and+adapt+things+to+your+own+needs.<br>|gqdtbKfv7l|jBWaxzt-4|6022814851197600081724ae|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/6022814851197600081724ae/welcome-to-webiny__cost-icon.svg|NLSOIstf9|<b>Low+cost+of+ownership</b>|kI-neIjkXx|Self-hosted+on+top+of+serverless+infrastructure.+No+infrastructure+to+mange,+less+people+required+to+operate+and+maintain.<br>|V14HHGmXN|-djsQadY-8|pTVeVoKkTi|bM5b8O7IMY|<b>Secure</b>|l9PuI-TdVA|Secured+by+AWS+Cognito.+It\'s+also+easy+to+integrate+services+like+OKTA,+Auth0+and+similar.<br>|N1lW0cAasg|W-ub9guhLt|602281486ed41f0008bc2dac|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486ed41f0008bc2dac/welcome-to-webiny__data-icon.svg|DVhLZfrM53|<b>Data+ownership</b>|shmIumNfIu|Webiny+is+self-hosted,+it+means+your+data+stays+within+your+data+center.+<br>|8F7J_16a46|2gtT4Mfw6c|602281486ed41f0008bc2dab|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/602281486ed41f0008bc2dab/welcome-to-webiny__permission-icon.svg|5EMJkVWgKW|<b>Permission+control</b>|cdSOjFAWkf|Powerful+options+to+control+the+permissions+your+users+will+have.+They+perfectly+align+with+your+business+requirements.&nbsp;<br>|5ggqk561Ka|100%25|C6B8QfkUXs|ChF1iOAbtb|7tRfsJ_SEz|Serverless+makes+infrastructure+easy,+</p><p>Webiny+makes+serverless+easy|oYf9t6Uwz|RdazJP-4W1|7jBNW1iTi|60228145f98841000981c721|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228145f98841000981c721/welcome-to-webiny__developer.svg|200px|npNMgLft0|1.+Developer-friendly|DpubDRaGQ|Webiny+has+been+made+with+the+developer+in+mind.+It+helps+them+develop+serverless+applications+with+ease.<br>|KbQocaayR|KDO-Ja7wS|60228145f98841000981c71f|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228145f98841000981c71f/welcome-to-webiny__octo-cat.svg|ETll3nkV4|2.+Open+source|UWPjvO7EC|Webiny+is+created+and+maintained+by+an+amazing+group+of+people.+Being+open+source+means+Webiny+grows+and+evolves+much+faster.+<a+href="https://github.com/webiny/webiny-js/blob/v5/docs/CONTRIBUTING.md">Contributor</a>+are+welcome.<br>|En4soRn06o|fqxeYbEV4|60228148fa244d0008c47c7a|https://d3oted5odtbsmd.cloudfront.net/files/demo-pages/60228148fa244d0008c47c7a/welcome-to-webiny__community-icon.png|276px|e5v0LBbfz|3.+Community|p9FWp5yqUy|We+have+an+active+community+on+<a+href="https://webiny.com/slack">slack</a>.+Talk+to+the+core-team,+and+get+help.+Webiny+team+is+always+there+for+any+questions.<br>|OYp5Z-6Xo|woaE-6v5bN|Y8ndbn88hy|View+Webiny+on+GitHub|https://github.com/webiny/webiny-js|secondary|fab|github|<svg+width="16"+viewBox="0+0+496+512"><path+d="M165.9+397.4c0+2-2.3+3.6-5.2+3.6-3.3.3-5.6-1.3-5.6-3.6+0-2+2.3-3.6+5.2-3.6+3-.3+5.6+1.3+5.6+3.6zm-31.1-4.5c-.7+2+1.3+4.3+4.3+4.9+2.6+1+5.6+0+6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2+2.3zm44.2-1.7c-2.9.7-4.9+2.6-4.6+4.9.3+2+2.9+3.3+5.9+2.6+2.9-.7+4.9-2.6+4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8+8C106.1+8+0+113.3+0+252c0+110.9+69.8+205.8+169.5+239.2+12.8+2.3+17.3-5.6+17.3-12.1+0-6.2-.3-40.4-.3-61.4+0+0-70+15-84.7-29.8+0+0-11.4-29.1-27.8-36.6+0+0-22.9-15.7+1.6-15.4+0+0+24.9+2+38.6+25.8+21.9+38.6+58.6+27.5+72.9+20.9+2.3-16+8.8-27.1+16-33.7-55.9-6.2-112.3-14.3-112.3-110.5+0-27.5+7.6-41.3+23.6-58.9-2.6-6.5-11.1-33.3+2.6-67.9+20.9-6.5+69+27+69+27+20-5.6+41.5-8.5+62.8-8.5s42.8+2.9+62.8+8.5c0+0+48.1-33.6+69-27+13.7+34.7+5.2+61.4+2.6+67.9+16+17.7+25.8+31.5+25.8+58.9+0+96.5-58.9+104.2-114.8+110.5+9.2+7.9+17+22.9+17+46.4+0+33.7-.3+75.4-.3+83.6+0+6.5+4.6+14.4+17.3+12.1C428.2+457.8+496+362.9+496+252+496+113.3+383.5+8+244.8+8zM97.2+352.9c-1.3+1-1+3.3.7+5.2+1.6+1.6+3.9+2.3+5.2+1+1.3-1+1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7+1.3.3+2.9+2.3+3.9+1.6+1+3.6.7+4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4+35.6c-1.6+1.3-1+4.3+1.3+6.2+2.3+2.3+5.2+2.6+6.5+1+1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6+1-1.6+3.6+0+5.9+1.6+2.3+4.3+3.3+5.6+2.3+1.6-1.3+1.6-3.9+0-6.2-1.4-2.3-4-3.3-5.6-2z"+fill="currentColor"></path></svg>^C|C|C|6|6|6|6|C|6|3|9|C|C|6|6|C|6|C|C|C|3|C|C|3|C|C|3|C|C|3|C|C|6|C|C|6|3|9|C|C|6|6|C|4|4|4|4|4|4|C|4|4|4|C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|N|H|O|I|P|G|P]|Q|$J|-1|I|M|G|M]]|R|$A|S]|T|$A|U]|V|$A|$W|$X|$0|Y|Z|10]]]]]]|6|@$0|11|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|14|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|1C|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BC]]]|6|@$0|1F|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|1G|Z|1H]|1I|1J]]|6|@]]]]]]|$0|1K|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|1L|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BD]]]|6|@$0|1M|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|1V]|4|$1O|1W]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|1X|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|1Y|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|1Z|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BE]]]|6|@$0|20|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|1V]|4|$1O|24]]|5|$D|$A|$L|F]]|K|$A|$L|F|J|-1|I|25|G|26]|Q|$I|F|G|F|J|-1]]]]|6|@]]]]]]|$0|27|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|2A|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2B|J|-1]|1A|$J|-1|I|F|H|P]|Q|$I|2C]]|K|$A|$L|F]]|12|$1E|BF]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2F|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|2I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|2J|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|2L]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|2M|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2N|J|-1]|1A|$J|-1|I|F]]|K|$A|$L|F]]|12|$1E|BG]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2O|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|2P]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|2Q|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|2R]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|2S|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]|1A|$J|-2]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|2T|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2B|J|-1]|1A|$J|-1|I|F|H|P]]|K|$A|$L|F]]|12|$1E|BH]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2U|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|2V]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|2W|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|2X]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|2Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|2N|J|-1]|Q|$J|-1|I|2N|E|F]|1A|$J|-1|I|F]]|K|$A|$L|F]]|12|$1E|BI]|V|$A|$W|$X|$0|2D|Z|2E]]]]]]|6|@$0|2Z|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|1V]|4|$1O|30]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|31|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|1V]|4|$1O|32]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]]]|$0|33|2|8|4|$5|$9|$A|$B|34]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|35|H|36|I|P|G|P]]|R|$A|S]|T|$A|U]]]|6|@$0|37|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|38|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|39|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BJ]]]|6|@$0|3A|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|3C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]|$0|3D|2|1N|4|$1O|$A|$2|1N|1P|3E|1R|S|1S|3F|1U|3B]|4|$1O|3G]]|5|$D|$A|$L|F|J|-1|E|P]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|3H|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|3I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|G|3K]|1A|$J|-1|G|F]]|12|$1E|BK]]]|6|@$0|3L|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|28|I|F|J|-1]]|12|$15|3M]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|S]|3N|$A|$3O|3P|1U|3Q|9|$L|3R|J|-1|H|3R]]]]]|6|@$0|3S|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BL]]]|6|@$0|3T|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|3U|Z|3V]|1I|3W]|3X|$]]|6|@]]]]|$0|3Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BM]]]|6|@$0|3Z|2|1N|4|$1O|$A|$2|1N|1P|40|1R|I|1S|41|1U|3B]|4|$1O|42]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|43|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|44|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BN]]]|6|@$0|45|2|21|4|$1O|$A|$2|21|1P|22|1R|I|1S|23|1U|3B]|4|$1O|46]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|47|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|P|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|48|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BO]]]|6|@$0|49|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|I|1S|4B|1U|3B]|4|$1O|4C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|4D|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|4E|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BP]]]|6|@$0|4F|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|4H]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|4I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BQ]]]|6|@$0|4J|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|4K]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|4L|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|4M|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BR]]]|6|@$0|4N|2|4O|4|$4P|4Q|5|$D|$A|$L|F|J|-1|E|4R]]|R|$A|U]]|3X|$4S|4T|4U|-1]|2|4V|4W|$0|@4X|4Y]|4Z|50|51|G|9|52]]|6|@]]]]]]]]|$0|53|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$E|F|G|F|H|F|I|F|L|F|J|-1]]|K|$A|$L|F|J|-1|I|3K]|1A|$J|-1|I|F]]|12|$1E|BS]]]|6|@$0|54|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|55|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BT]]]|6|@$0|56|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|57|Z|58]]|3X|$]]|6|@]]]]]]|$0|59|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5A|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BU]]]|6|@$0|5B|2|1N|4|$1O|$A|$2|1N|1P|3E|1R|I|1S|3F|1U|3B]|4|$1O|5C]]|5|$D|$A|$L|F|J|-1]]|K|$A|$L|F]]]]|6|@]]|$0|5D|2|21|4|$1O|$A|$2|21|1P|22|1R|I|1S|23|1U|3B]|4|$1O|5E]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]]]]]]]]]|$0|5F|2|8|4|$5|$9|$A|$B|5G]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|5H|G|P|H|5I|I|P|J|-1]]|R|$A|S]|T|$A|U]|V|$A|$W|$X|$0|5J|Z|5K]]]]]]|6|@$0|5L|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|5M|I|F|J|-1]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5N|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BV]]]|6|@$0|5O|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|5P]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|5Q|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|5R]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5S|2|1D|4|$5|$D|$A|$E|F|G|F|H|3J|I|F|J|-1]]|K|$A|$L|F|J|-1|G|5T]|1A|$I|5T|J|-1]]|12|$1E|BW]]]|6|@$0|5U|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|5V|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BX]]]|6|@$0|5W|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|5X|Z|5Y]|1I|5Z]|3X|$]]|6|@]]]]]]|$0|60|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|14|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|61|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|BY]]]|6|@$0|62|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|63]]|5|$D|$A|$L|F|J|-1|H|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|64|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|65]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|66|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|5T|G|5T]]|12|$1E|BZ]]]|6|@$0|67|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|68|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C0]]]|6|@$0|69|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6A|Z|6B]|1I|5Z]]|6|@]]]]]]|$0|6C|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6D|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C1]]]|6|@$0|6E|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|6F]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|6G|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|6H]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]|$0|6I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|5T|G|5T]]|12|$1E|C2]]]|6|@$0|6J|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6K|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C3]]]|6|@$0|6L|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6M|Z|6N]|1I|5Z]|3X|$]]|6|@]]]]]]|$0|6O|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6P|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C4]]]|6|@$0|6Q|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|6R]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|6S|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|6T]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]|$0|6U|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|5T]|1A|$G|5T|J|-1]]|12|$1E|C5]]]|6|@$0|6V|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|28|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|6W|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C6]]]|6|@$0|6X|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6Y|Z|6Z]|1I|5Z]]|6|@]]]]]]|$0|70|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|71|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C7]]]|6|@$0|72|2|1N|4|$1O|$A|$2|1N|1P|2G|1R|S|1S|2H|1U|3B]|4|$1O|73]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|74|2|21|4|$1O|$A|$2|21|1P|2K|1R|S|1S|23|1U|3B]|4|$1O|75]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]]]]]|$0|76|2|8|4|$5|$9|$A|$B|77]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|78|G|P|H|36|I|P|J|-1]]|R|$A|S]|T|$A|U]]]|6|@$0|79|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7A|2|1D|4|$5|$D|$A|$E|F|G|F|H|38|I|F|J|-1]|1A|$J|-1]]|K|$A|$L|F|J|-1|G|3K]|1A|$J|-1|G|F]]|12|$1E|C8]]]|6|@$0|7B|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7C|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|C9]]]|6|@$0|7D|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|7E|Z|7F]|9|7G]]|6|@]]]]]]|$0|7H|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7I|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CA]]]|6|@$0|7J|2|1N|4|$1O|$A|$2|1N|1P|3E|1R|I|1S|3F|1U|3B]|4|$1O|7K]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|7L|2|21|4|$1O|$A|$2|21|1P|22|1R|I|1S|23|1U|3B]|4|$1O|7M]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]]]|$0|7N|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|J|-1|I|3K]|1A|$J|-1|I|F]]|12|$1E|CB]]]|6|@$0|7O|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|28|I|F|J|-1]]|12|$15|3M]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]|3N|$A|$3O|3P|1U|7P|9|$J|-1|H|3R]]]]]|6|@$0|7Q|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CC]]]|6|@$0|7R|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|7S|Z|7T]|1I|3W]|3X|$]]|6|@]]]]|$0|7U|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CD]]]|6|@$0|7V|2|1N|4|$1O|$A|$2|1N|1P|40|1R|I|1S|41]|4|$1O|7W]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|7X|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|28|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|7Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CE]]]|6|@$0|7Z|2|1N|4|$1O|$A|$2|1N|1P|80|1R|I|1S|81|1U|3B]|4|$1O|82]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|83|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|4R|G|F|H|14|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|84|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CF]]]|6|@$0|85|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|I|1S|4B|1U|3B]|4|$1O|86]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|87|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|29]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|88|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CG]]]|6|@$0|89|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|8A]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]|$0|8B|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CH]]]|6|@$0|8C|2|4G|4|$1O|$A|$2|4G|1P|4G|1R|I|1S|23|1U|3B]|4|$1O|8D]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|8E|2|4O|4|$4P|8F|5|$D|$A|$L|F|J|-1|E|4R]]|R|$A|U]]|3X|$4S|8G|4U|-1]|2|4V|4W|$0|@4X|4Y]|4Z|8H|51|G|9|52]]|6|@]]]]]]]]|$0|8I|2|8|4|$5|$9|$A|$B|8J]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|38|H|8K|I|P|G|P]]|R|$A|S]|T|$A|U]|V|$A|$W|$X|$0|8L|Z|8M]]]]]]|6|@$0|8N|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|5H|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|8O|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CI]]]|6|@$0|8P|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|8Q]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|8R|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|8S]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|8T|2|1D|4|$5|$D|$A|$E|F|G|F|H|3J|I|F|J|-1]]|K|$A|$L|F|J|-1|G|8U]|1A|$J|-1|G|8U|I|8U]]|12|$1E|CJ]]]|6|@$0|8V|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|8W|Z|8X]|1I|8Y]|3X|$]]|6|@]]|$0|8Z|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|90]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|91|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|92]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|93|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|8U|G|8U]]|12|$1E|CK]]]|6|@$0|94|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|95|Z|96]|1I|8Y]|3X|$]]|6|@]]|$0|97|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|98]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|99|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|9A]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|9B|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|8U]|1A|$J|-1|G|8U]]|12|$1E|CL]]]|6|@$0|9C|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|9D|Z|9E]|1I|8Y]|3X|$]]|6|@]]|$0|9F|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|9G]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|9H|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|9I]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|9J|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|5H|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|8S]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|9K|2|1D|4|$5|$D|$A|$E|F|G|F|H|3J|I|F|J|-1]]|K|$A|$L|F|J|-1|G|8U]|1A|$J|-1|I|8U]]|12|$1E|CM]]]|6|@$0|9L|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|6M|Z|6N]|1I|8Y]|3X|$]]|6|@]]|$0|9M|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|9N]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|9O|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|9P]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|9Q|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$H|3J|J|-1]]|K|$A|$L|F|J|-1|I|8U|G|8U]]|12|$1E|CN]]]|6|@$0|9R|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|9S|Z|9T]|1I|8Y]|3X|$]]|6|@]]|$0|9U|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|9V]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|9W|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23]|4|$1O|9X]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|9Y|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|8U]|1A|$J|-1|G|8U]]|12|$1E|CO]]]|6|@$0|9Z|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|A0|Z|A1]|1I|8Y]|3X|$]]|6|@]]|$0|A2|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|A3]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|A4|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|A5]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]]]]]|$0|A6|2|8|4|$5|$9|$A|$B|A7]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M|J|-1|E|N|H|N|I|P|G|P]]|R|$A|S]|T|$A|U]]]|6|@$0|A8|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|A9|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CP]]]|6|@$0|AA|2|1N|4|$1O|$A|$2|1N|1P|1Q|1R|S|1S|1T|1U|3B]|4|$1O|AB]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|AC|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|38|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|8S]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|AD|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|G|4R]|1A|$G|4R|J|-1|I|4R]]|12|$1E|CQ]]]|6|@$0|AE|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|AF|Z|AG]|1I|AH]|3X|$]]|6|@]]|$0|AI|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|AJ]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]|$0|AK|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|AL]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|AM|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|3J]]|K|$A|$L|F|J|-1|I|4R|G|4R]]|12|$1E|CR]]]|6|@$0|AN|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|AO|Z|AP]|1I|AH]|3X|$]]|6|@]]|$0|AQ|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|AR]]|5|$D|$A|$L|F|J|-1|E|14]]|K|$A|$L|F]]]]|6|@]]|$0|AS|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|AT]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]|$0|AU|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]|1A|$J|-1|H|4R]]|K|$A|$L|F|J|-1|I|4R]|1A|$J|-1|I|4R|G|4R]]|12|$1E|CS]]]|6|@$0|AV|2|W|4|$5|$R|$A|S]|D|$A|$L|F]]|K|$A|$L|F]]]|W|$X|$0|AW|Z|AX]|1I|AH|9|AY]|3X|$]]|6|@]]|$0|AZ|2|1N|4|$1O|$A|$2|1N|1P|4A|1R|S|1S|4B|1U|3B]|4|$1O|B0]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]|$0|B1|2|21|4|$1O|$A|$2|21|1P|22|1R|S|1S|23|1U|3B]|4|$1O|B2]]|5|$D|$A|$L|F|J|-1|E|M]]|K|$A|$L|F]]]]|6|@]]]]]]|$0|B3|2|12|4|$5|$9|$A|$B|13]]|D|$A|$E|3J|G|F|H|F|I|F|J|-1]]|K|$A|$L|F|E|F|G|F|H|F|I|F]]|12|$15|16]|17|$A|$18|19]|1A|$18|1B]]|R|$A|U]|T|$A|U]]]|6|@$0|B4|2|1D|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|12|$1E|CT]]]|6|@$0|B5|2|4O|4|$4P|B6|5|$D|$A|$L|F]]|R|$A|S]]|3X|$4S|B7|4U|-1]|2|B8|4W|$0|@B9|BA]|4Z|BB|9|52]]|6|@]]]]]]]]]]'
        },
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:59.947Z",
        editor: "page-builder",
        id: "658c1bd3c39bb10008431b5b#0001",
        locale: "en-US",
        locked: true,
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        path: "/welcome-to-webiny",
        pid: "658c1bd3c39bb10008431b5b",
        publishedOn: "2023-12-27T12:43:00.723Z",
        savedOn: "2023-12-27T12:43:00.723Z",
        settings: {
            general: {
                layout: "static"
            },
            seo: {
                meta: []
            },
            social: {
                meta: []
            }
        },
        status: "published",
        tenant: "root",
        title: "Welcome to Webiny",
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c24a16607be00087f1168",
        SK: "L",
        created: "2023-12-27T13:20:34.204Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:20:33.775Z",
        entity: "CmsEntries",
        entryId: "658c24a16607be00087f1168",
        firstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        firstPublishedOn: "2023-12-27T13:20:34.175Z",
        id: "658c24a16607be00087f1168#0001",
        lastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        lastPublishedOn: "2023-12-27T13:20:34.175Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        modelId: "modelA",
        modified: "2023-12-27T13:20:34.204Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        publishedOn: "2023-12-27T13:20:34.175Z",
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:20:33.775Z",
        revisionFirstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionFirstPublishedOn: "2023-12-27T13:20:34.175Z",
        revisionLastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionLastPublishedOn: "2023-12-27T13:20:34.175Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:20:34.175Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:20:34.175Z",
        status: "published",
        tenant: "root",
        values: {
            "long-text@z2tdm05d": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBUcM0rKapUMAIAFvZsCRgAAAA="
            },
            "text@f2qcuuzs": "DDB+ES - Model A Entry 3"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c24a16607be00087f1168",
        SK: "P",
        TYPE: "cms.entry.p",
        created: "2023-12-27T13:20:34.199Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:20:33.775Z",
        entity: "CmsEntries",
        entryId: "658c24a16607be00087f1168",
        firstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        firstPublishedOn: "2023-12-27T13:20:34.175Z",
        id: "658c24a16607be00087f1168#0001",
        lastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        lastPublishedOn: "2023-12-27T13:20:34.175Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        modelId: "modelA",
        modified: "2023-12-27T13:20:34.199Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        publishedOn: "2023-12-27T13:20:34.175Z",
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:20:33.775Z",
        revisionFirstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionFirstPublishedOn: "2023-12-27T13:20:34.175Z",
        revisionLastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionLastPublishedOn: "2023-12-27T13:20:34.175Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:20:34.175Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:20:34.175Z",
        status: "published",
        tenant: "root",
        values: {
            "long-text@z2tdm05d": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBUcM0rKapUMAIAFvZsCRgAAAA="
            },
            "text@f2qcuuzs": "DDB+ES - Model A Entry 3"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c24a16607be00087f1168",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T13:20:34.199Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:20:33.775Z",
        entity: "CmsEntries",
        entryId: "658c24a16607be00087f1168",
        firstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        firstPublishedOn: "2023-12-27T13:20:34.175Z",
        id: "658c24a16607be00087f1168#0001",
        lastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        lastPublishedOn: "2023-12-27T13:20:34.175Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        modelId: "modelA",
        modified: "2023-12-27T13:20:34.199Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        publishedOn: "2023-12-27T13:20:34.175Z",
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:20:33.775Z",
        revisionFirstPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionFirstPublishedOn: "2023-12-27T13:20:34.175Z",
        revisionLastPublishedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionLastPublishedOn: "2023-12-27T13:20:34.175Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:20:34.175Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:20:34.175Z",
        status: "published",
        tenant: "root",
        values: {
            "long-text@z2tdm05d": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBUcM0rKapUMAIAFvZsCRgAAAA="
            },
            "text@f2qcuuzs": "DDB+ES - Model A Entry 3"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228148fa244d0008c47c7a",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.301Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228148fa244d0008c47c7a",
        id: "60228148fa244d0008c47c7a#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.301Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 17382,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228148fa244d0008c47c7a/welcome-to-webiny__community-icon.png",
            "text@name": "community-icon.png",
            "text@tags": [],
            "text@type": "image/png"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#60228148fa244d0008c47c7a",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.301Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "60228148fa244d0008c47c7a",
        id: "60228148fa244d0008c47c7a#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.301Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 17382,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/60228148fa244d0008c47c7a/welcome-to-webiny__community-icon.png",
            "text@name": "community-icon.png",
            "text@tags": [],
            "text@type": "image/png"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        GSI1_PK: "TENANTS",
        GSI1_SK: "T#null#2023-12-27T12:40:58.921Z",
        PK: "T#root",
        SK: "A",
        TYPE: "tenancy.tenant",
        _ct: "2023-12-27T12:40:58.922Z",
        _et: "TenancyTenant",
        _md: "2023-12-27T12:40:58.922Z",
        data: {
            createdOn: "2023-12-27T12:40:58.921Z",
            description: "The top-level Webiny tenant.",
            id: "root",
            name: "Root",
            parent: null,
            savedOn: "2023-12-27T12:40:58.921Z",
            settings: {
                domains: []
            },
            status: "active",
            tags: [],
            webinyVersion: "5.38.2"
        }
    },
    {
        PK: "T#root#L#en-US#PB#SETTINGS",
        SK: "A",
        TYPE: "pb.settings",
        _ct: "2023-12-27T12:43:01.222Z",
        _et: "PbSettings",
        _md: "2023-12-27T12:43:01.222Z",
        data: {
            locale: "en-US",
            name: "devr",
            pages: {
                home: "658c1bd3c39bb10008431b5b",
                notFound: "658c1bd3c39bb10008431b5c"
            },
            prerendering: {
                app: {
                    url: null
                },
                meta: {},
                storage: {
                    name: null
                }
            },
            tenant: "root",
            type: "default",
            websiteUrl: null
        }
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814b0df4b000088735bc",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:58.924Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814b0df4b000088735bc",
        id: "6022814b0df4b000088735bc#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:58.924Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 5053,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/6022814b0df4b000088735bc/welcome-to-webiny__webiny-logo.svg",
            "text@name": "webiny-logo.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814b0df4b000088735bc",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:58.924Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814b0df4b000088735bc",
        id: "6022814b0df4b000088735bc#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:58.924Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 5053,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/6022814b0df4b000088735bc/welcome-to-webiny__webiny-logo.svg",
            "text@name": "webiny-logo.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#FM#SETTINGS",
        SK: "A",
        TYPE: "fm.settings",
        _ct: "2023-12-27T12:42:52.281Z",
        _et: "FM.Settings",
        _md: "2023-12-27T12:42:52.281Z",
        data: {
            srcPrefix: "https://d3oted5odtbsmd.cloudfront.net/files/",
            tenant: "root",
            uploadMaxFileSize: 10737418240,
            uploadMinFileSize: 0
        }
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c24aa6607be00087f1169",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T13:20:42.181Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:20:42.180Z",
        entity: "CmsEntries",
        entryId: "658c24aa6607be00087f1169",
        id: "658c24aa6607be00087f1169#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "modelA",
        modified: "2023-12-27T13:20:42.181Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:20:42.180Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:20:42.180Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:20:42.180Z",
        status: "draft",
        tenant: "root",
        values: {
            "long-text@z2tdm05d": {
                compression: "gzip",
                value: "H4sIAAAAAAAAAwMAAAAAAAAAAAA="
            },
            "text@f2qcuuzs": "DDB+ES - Model A Entry 4"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c24aa6607be00087f1169",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T13:20:42.181Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:20:42.180Z",
        entity: "CmsEntries",
        entryId: "658c24aa6607be00087f1169",
        id: "658c24aa6607be00087f1169#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "modelA",
        modified: "2023-12-27T13:20:42.181Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:20:42.180Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:20:42.180Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:20:42.180Z",
        status: "draft",
        tenant: "root",
        values: {
            "long-text@z2tdm05d": {
                compression: "gzip",
                value: "H4sIAAAAAAAAAwMAAAAAAAAAAAA="
            },
            "text@f2qcuuzs": "DDB+ES - Model A Entry 4"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "PS#SETTINGS",
        SK: "default",
        data: {
            appUrl: "https://d1c9xtq19d4x6u.cloudfront.net",
            bucket: "wby-delivery-68ac55a",
            cloudfrontId: "E12G8OCR2J2BDW",
            deliveryUrl: "https://d1jwcc7rxvj5th.cloudfront.net",
            sqsQueueUrl:
                "https://sqs.eu-central-1.amazonaws.com/674320871285/wby-ps-render-queue-bcd2dfd.fifo"
        }
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c2531adbc1700090e1ad2",
        SK: "L",
        TYPE: "L",
        created: "2023-12-27T13:23:15.570Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:22:57.094Z",
        entity: "CmsEntries",
        entryId: "658c2531adbc1700090e1ad2",
        id: "658c2531adbc1700090e1ad2#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "modelB",
        modified: "2023-12-27T13:23:15.570Z",
        modifiedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        modifiedOn: "2023-12-27T13:23:15.536Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:22:57.094Z",
        revisionModifiedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionModifiedOn: "2023-12-27T13:23:15.536Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:23:15.536Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:23:15.536Z",
        status: "draft",
        tenant: "root",
        values: {
            "file@5atpz8nu": null,
            "long-text@7c5t8wwa": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBScM0rKapUMFIIDXBxDHF1AQA3yyBkIAAAAA=="
            },
            "text@4dep2w2h": "DDB+ES - Model B Entry 2 UPDATED"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#658c2531adbc1700090e1ad2",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T13:23:15.570Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T13:22:57.094Z",
        entity: "CmsEntries",
        entryId: "658c2531adbc1700090e1ad2",
        id: "658c2531adbc1700090e1ad2#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "modelB",
        modified: "2023-12-27T13:23:15.570Z",
        modifiedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        modifiedOn: "2023-12-27T13:23:15.536Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T13:22:57.094Z",
        revisionModifiedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionModifiedOn: "2023-12-27T13:23:15.536Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T13:23:15.536Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T13:23:15.536Z",
        status: "draft",
        tenant: "root",
        values: {
            "file@5atpz8nu": null,
            "long-text@7c5t8wwa": {
                compression: "gzip",
                value: "H4sIAAAAAAAAA3NxcdJ2DVbQVfDNT0nNUXBScM0rKapUMFIIDXBxDHF1AQA3yyBkIAAAAA=="
            },
            "text@4dep2w2h": "DDB+ES - Model B Entry 2 UPDATED"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#602281486ed41f0008bc2dad",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.062Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "602281486ed41f0008bc2dad",
        id: "602281486ed41f0008bc2dad#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.062Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 108898,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/602281486ed41f0008bc2dad/welcome-to-webiny__webiny-serverless-cms.png",
            "text@name": "webiny-serverless-cms.png  ",
            "text@tags": [],
            "text@type": "image/png"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#602281486ed41f0008bc2dad",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.061Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "602281486ed41f0008bc2dad",
        id: "602281486ed41f0008bc2dad#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.061Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 108898,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key":
                "demo-pages/602281486ed41f0008bc2dad/welcome-to-webiny__webiny-serverless-cms.png",
            "text@name": "webiny-serverless-cms.png  ",
            "text@tags": [],
            "text@type": "image/png"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        GSI1_PK: "T#root#PS#TAG",
        GSI1_SK: "pb-menu#main-menu#/not-found",
        PK: "T#root#PS#TAG#pb-menu#main-menu#/not-found",
        SK: "main-menu#/not-found",
        TYPE: "ps.tagPathLink",
        _ct: "2023-12-27T12:43:23.860Z",
        _et: "PrerenderingServiceTagPathLink",
        _md: "2023-12-27T12:43:23.860Z",
        data: {
            key: "pb-menu",
            path: "/not-found",
            tenant: "root",
            value: "main-menu"
        }
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814bef4a940008b3ba28",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.045Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814bef4a940008b3ba28",
        id: "6022814bef4a940008b3ba28#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.045Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 132767,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/6022814bef4a940008b3ba28/welcome-to-webiny__environments.svg",
            "text@name": "environments.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#6022814bef4a940008b3ba28",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.045Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "6022814bef4a940008b3ba28",
        id: "6022814bef4a940008b3ba28#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.045Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 132767,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/6022814bef4a940008b3ba28/welcome-to-webiny__environments.svg",
            "text@name": "environments.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#602281486ed41f0008bc2dac",
        SK: "L",
        TYPE: "cms.entry.l",
        created: "2023-12-27T12:42:59.161Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "602281486ed41f0008bc2dac",
        id: "602281486ed41f0008bc2dac#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.161Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 73153,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/602281486ed41f0008bc2dac/welcome-to-webiny__data-icon.svg",
            "text@name": "data-icon.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#602281486ed41f0008bc2dac",
        SK: "REV#0001",
        TYPE: "cms.entry",
        created: "2023-12-27T12:42:59.161Z",
        createdBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        createdOn: "2023-12-27T12:42:58.754Z",
        entity: "CmsEntries",
        entryId: "602281486ed41f0008bc2dac",
        id: "602281486ed41f0008bc2dac#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fmFile",
        modified: "2023-12-27T12:42:59.161Z",
        ownedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionCreatedOn: "2023-12-27T12:42:58.754Z",
        revisionSavedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        revisionSavedOn: "2023-12-27T12:42:58.754Z",
        savedBy: {
            displayName: "ad min",
            id: "658c1b73c39bb10008431b44",
            type: "admin"
        },
        savedOn: "2023-12-27T12:42:58.754Z",
        status: "draft",
        tenant: "root",
        values: {
            "number@size": 73153,
            "object@location": {
                "text@folderId": "root"
            },
            "object@meta": {
                "boolean@private": true
            },
            "text@aliases": [],
            "text@key": "demo-pages/602281486ed41f0008bc2dac/welcome-to-webiny__data-icon.svg",
            "text@name": "data-icon.svg",
            "text@tags": [],
            "text@type": "image/svg+xml"
        },
        version: 1,
        webinyVersion: "5.38.2"
    },
    {
        GSI1_PK: "T#root#ADMIN_USERS",
        GSI1_SK: "admin@webiny.com",
        PK: "T#root#ADMIN_USER#658c1b73c39bb10008431b44",
        SK: "A",
        TYPE: "adminUsers.user",
        _ct: "2023-12-27T12:41:24.417Z",
        _et: "AdminUsers.User",
        _md: "2023-12-27T12:41:24.417Z",
        data: {
            createdBy: null,
            createdOn: "2023-12-27T12:41:23.982Z",
            displayName: "ad min",
            email: "admin@webiny.com",
            firstName: "ad",
            group: "658c1b60c39bb10008431b42",
            id: "658c1b73c39bb10008431b44",
            lastName: "min",
            tenant: "root",
            webinyVersion: "5.38.2"
        }
    }
];
