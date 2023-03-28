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

export const createPagesData = () => {
    return [
        {
            PK: "T#root#L#en-US#PB#P",
            SK: "64229f4fce15ca00086c890e",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|MolpC3bKAW|type|document|data|settings|elements|K54r8pib0f|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|5ZWEOYhcLm|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|dfFkB6NDdJ|cell|size|7HZSe8qd1q|heading|text|typography|heading1|alignment|tag|h1|Home+title|path|1EDaOTibHO|paragraph|paragraph1|p|Lorem+ipsum+dolor+sit+amet,+consectetur+adipiscing+elit.^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|1J]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]"
            },
            createdBy,
            createdOn: "2023-03-28T08:03:27.410Z",
            editor: "page-builder",
            GSI1_PK: "T#root#L#en-US#PB#PATH",
            GSI1_SK: "/untitled-lfrz14x0",
            id: "64229f4fce15ca00086c890e#0001",
            locale: "en-US",
            locked: true,
            ownedBy: createdBy,
            path: "/untitled-lfrz14x0",
            pid: "64229f4fce15ca00086c890e",
            publishedOn: "2023-03-28T08:03:55.854Z",
            savedOn: "2023-03-28T08:03:55.854Z",
            settings: {
                general: {
                    image: null,
                    layout: "static",
                    snippet: null,
                    tags: null
                },
                seo: {
                    description: null,
                    meta: [],
                    title: null
                },
                social: {
                    description: null,
                    image: null,
                    meta: [],
                    title: null
                }
            },
            status: "published",
            tenant: "root",
            title: "Home",
            titleLC: "home",
            TYPE: "pb.page.p",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2023-03-28T08:03:55.855Z",
            _et: "PbPages",
            _md: "2023-03-28T08:03:55.855Z"
        },
        {
            PK: "T#root#L#en-US#PB#L",
            SK: "64229f4fce15ca00086c890e",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|MolpC3bKAW|type|document|data|settings|elements|K54r8pib0f|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|5ZWEOYhcLm|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|dfFkB6NDdJ|cell|size|7HZSe8qd1q|heading|text|typography|heading1|alignment|tag|h1|Home+title|path|1EDaOTibHO|paragraph|paragraph1|p|Lorem+ipsum+dolor+sit+amet,+consectetur+adipiscing+elit.^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|1J]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]"
            },
            createdBy,
            createdOn: "2023-03-28T08:03:27.410Z",
            editor: "page-builder",
            id: "64229f4fce15ca00086c890e#0001",
            locale: "en-US",
            locked: true,
            ownedBy: createdBy,
            path: "/untitled-lfrz14x0",
            pid: "64229f4fce15ca00086c890e",
            publishedOn: "2023-03-28T08:03:55.854Z",
            savedOn: "2023-03-28T08:03:55.854Z",
            settings: {
                general: {
                    image: null,
                    layout: "static",
                    snippet: null,
                    tags: null
                },
                seo: {
                    description: null,
                    meta: [],
                    title: null
                },
                social: {
                    description: null,
                    image: null,
                    meta: [],
                    title: null
                }
            },
            status: "published",
            tenant: "root",
            title: "Home",
            titleLC: "home",
            TYPE: "pb.page.l",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2023-03-28T08:03:55.855Z",
            _et: "PbPages",
            _md: "2023-03-28T08:03:55.855Z"
        },
        {
            PK: "T#root#L#en-US#PB#64229f4fce15ca00086c890e",
            SK: "1",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|MolpC3bKAW|type|document|data|settings|elements|K54r8pib0f|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|5ZWEOYhcLm|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|dfFkB6NDdJ|cell|size|7HZSe8qd1q|heading|text|typography|heading1|alignment|tag|h1|Home+title|path|1EDaOTibHO|paragraph|paragraph1|p|Lorem+ipsum+dolor+sit+amet,+consectetur+adipiscing+elit.^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|1J]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]"
            },
            createdBy,
            createdOn: "2023-03-28T08:03:27.410Z",
            editor: "page-builder",
            id: "64229f4fce15ca00086c890e#0001",
            locale: "en-US",
            locked: true,
            ownedBy: createdBy,
            path: "/untitled-lfrz14x0",
            pid: "64229f4fce15ca00086c890e",
            publishedOn: "2023-03-28T08:03:55.854Z",
            savedOn: "2023-03-28T08:03:55.854Z",
            settings: {
                general: {
                    image: null,
                    layout: "static",
                    snippet: null,
                    tags: null
                },
                seo: {
                    description: null,
                    meta: [],
                    title: null
                },
                social: {
                    description: null,
                    image: null,
                    meta: [],
                    title: null
                }
            },
            status: "published",
            tenant: "root",
            title: "Home",
            titleLC: "home",
            TYPE: "pb.page",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2023-03-28T08:03:55.854Z",
            _et: "PbPages",
            _md: "2023-03-28T08:03:55.854Z"
        },
        {
            PK: "T#root#L#en-US#PB#P",
            SK: "64229f6fce15ca00086c890f",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|HvJ84m0Iic|type|document|data|settings|elements|gXx1W7tITY|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|ZcqeQjzAt2|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|RQsf4x5nDb|cell|size|cZDkU3tEdt|heading|text|typography|heading1|alignment|tag|h1|Page+1+title|path|irEHg5T9fK|paragraph|paragraph1|p|Suspendisse+varius+enim+in+eros+elementum+tristique.^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|1J]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]"
            },
            createdBy,
            createdOn: "2023-03-28T08:03:59.776Z",
            editor: "page-builder",
            GSI1_PK: "T#root#L#en-US#PB#PATH",
            GSI1_SK: "/untitled-lfrz1twf",
            id: "64229f6fce15ca00086c890f#0001",
            locale: "en-US",
            locked: true,
            ownedBy: createdBy,
            path: "/untitled-lfrz1twf",
            pid: "64229f6fce15ca00086c890f",
            publishedOn: "2023-03-28T08:04:25.918Z",
            savedOn: "2023-03-28T08:04:25.918Z",
            settings: {
                general: {
                    image: null,
                    layout: "static",
                    snippet: null,
                    tags: null
                },
                seo: {
                    description: null,
                    meta: [],
                    title: null
                },
                social: {
                    description: null,
                    image: null,
                    meta: [],
                    title: null
                }
            },
            status: "published",
            tenant: "root",
            title: "Page 1",
            titleLC: "page 1",
            TYPE: "pb.page.p",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2023-03-28T08:04:25.919Z",
            _et: "PbPages",
            _md: "2023-03-28T08:04:25.919Z"
        },
        {
            PK: "T#root#L#en-US#PB#L",
            SK: "64229f6fce15ca00086c890f",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|HvJ84m0Iic|type|document|data|settings|elements|gXx1W7tITY|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|ZcqeQjzAt2|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|RQsf4x5nDb|cell|size|cZDkU3tEdt|heading|text|typography|heading1|alignment|tag|h1|Page+1+title|path|irEHg5T9fK|paragraph|paragraph1|p|Suspendisse+varius+enim+in+eros+elementum+tristique.^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|1J]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]"
            },
            createdBy,
            createdOn: "2023-03-28T08:03:59.776Z",
            editor: "page-builder",
            id: "64229f6fce15ca00086c890f#0001",
            locale: "en-US",
            locked: true,
            ownedBy: createdBy,
            path: "/untitled-lfrz1twf",
            pid: "64229f6fce15ca00086c890f",
            publishedOn: "2023-03-28T08:04:25.918Z",
            savedOn: "2023-03-28T08:04:25.918Z",
            settings: {
                general: {
                    image: null,
                    layout: "static",
                    snippet: null,
                    tags: null
                },
                seo: {
                    description: null,
                    meta: [],
                    title: null
                },
                social: {
                    description: null,
                    image: null,
                    meta: [],
                    title: null
                }
            },
            status: "published",
            tenant: "root",
            title: "Page 1",
            titleLC: "page 1",
            TYPE: "pb.page.l",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2023-03-28T08:04:25.919Z",
            _et: "PbPages",
            _md: "2023-03-28T08:04:25.919Z"
        },
        {
            PK: "T#root#L#en-US#PB#64229f6fce15ca00086c890f",
            SK: "1",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|HvJ84m0Iic|type|document|data|settings|elements|gXx1W7tITY|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|ZcqeQjzAt2|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|RQsf4x5nDb|cell|size|cZDkU3tEdt|heading|text|typography|heading1|alignment|tag|h1|Page+1+title|path|irEHg5T9fK|paragraph|paragraph1|p|Suspendisse+varius+enim+in+eros+elementum+tristique.^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|1J]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]"
            },
            createdBy,
            createdOn: "2023-03-28T08:03:59.776Z",
            editor: "page-builder",
            id: "64229f6fce15ca00086c890f#0001",
            locale: "en-US",
            locked: true,
            ownedBy: createdBy,
            path: "/untitled-lfrz1twf",
            pid: "64229f6fce15ca00086c890f",
            publishedOn: "2023-03-28T08:04:25.918Z",
            savedOn: "2023-03-28T08:04:25.918Z",
            settings: {
                general: {
                    image: null,
                    layout: "static",
                    snippet: null,
                    tags: null
                },
                seo: {
                    description: null,
                    meta: [],
                    title: null
                },
                social: {
                    description: null,
                    image: null,
                    meta: [],
                    title: null
                }
            },
            status: "published",
            tenant: "root",
            title: "Page 1",
            titleLC: "page 1",
            TYPE: "pb.page",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2023-03-28T08:04:25.918Z",
            _et: "PbPages",
            _md: "2023-03-28T08:04:25.918Z"
        }
    ];
};

export const createAcoSearchData = () => {
    return [
        {
            PK: "T#root#L#en-US#CMS#CME#CME#64229f4fce15ca00086c890e",
            SK: "L",
            createdBy,
            createdOn: expect.any(String),
            entryId: "64229f4fce15ca00086c890e",
            GSI1_PK: "T#root#L#en-US#CMS#CME#M#acoSearchRecord#L",
            GSI1_SK: "64229f4fce15ca00086c890e#0001",
            id: "64229f4fce15ca00086c890e#0001",
            locale: "en-US",
            locked: false,
            meta: {},
            modelId: "acoSearchRecord",
            modifiedBy: createdBy,
            ownedBy: createdBy,
            savedOn: expect.any(String),
            status: "draft",
            tenant: "root",
            TYPE: "cms.entry.l",
            values: {
                content: "Home Home title Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                data: {
                    createdBy: createdBy,
                    createdOn: expect.any(String),
                    id: "64229f4fce15ca00086c890e#0001",
                    locked: true,
                    path: "/untitled-lfrz14x0",
                    pid: "64229f4fce15ca00086c890e",
                    savedOn: expect.any(String),
                    status: "published",
                    title: "Home",
                    version: 1
                },
                location: {
                    folderId: "ROOT"
                },
                title: "Home",
                type: "PbPage"
            },
            version: 1,
            webinyVersion: "0.0.0",
            created: expect.any(String),
            entity: "CmsEntries",
            modified: expect.any(String)
        },
        {
            PK: "T#root#L#en-US#CMS#CME#CME#64229f4fce15ca00086c890e",
            SK: "REV#0001",
            createdBy,
            createdOn: expect.any(String),
            entryId: "64229f4fce15ca00086c890e",
            GSI1_PK: "T#root#L#en-US#CMS#CME#M#acoSearchRecord#A",
            GSI1_SK: "64229f4fce15ca00086c890e#0001",
            id: "64229f4fce15ca00086c890e#0001",
            locale: "en-US",
            locked: false,
            meta: {},
            modelId: "acoSearchRecord",
            modifiedBy: createdBy,
            ownedBy: createdBy,
            savedOn: expect.any(String),
            status: "draft",
            tenant: "root",
            TYPE: "cms.entry",
            values: {
                content: "Home Home title Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                data: {
                    createdBy: createdBy,
                    createdOn: expect.any(String),
                    id: "64229f4fce15ca00086c890e#0001",
                    locked: true,
                    path: "/untitled-lfrz14x0",
                    pid: "64229f4fce15ca00086c890e",
                    savedOn: expect.any(String),
                    status: "published",
                    title: "Home",
                    version: 1
                },
                location: {
                    folderId: "ROOT"
                },
                title: "Home",
                type: "PbPage"
            },
            version: 1,
            webinyVersion: "0.0.0",
            created: expect.any(String),
            entity: "CmsEntries",
            modified: expect.any(String)
        },
        {
            PK: "T#root#L#en-US#CMS#CME#CME#64229f6fce15ca00086c890f",
            SK: "L",
            createdBy,
            createdOn: expect.any(String),
            entryId: "64229f6fce15ca00086c890f",
            GSI1_PK: "T#root#L#en-US#CMS#CME#M#acoSearchRecord#L",
            GSI1_SK: "64229f6fce15ca00086c890f#0001",
            id: "64229f6fce15ca00086c890f#0001",
            locale: "en-US",
            locked: false,
            meta: {},
            modelId: "acoSearchRecord",
            modifiedBy: createdBy,
            ownedBy: createdBy,
            savedOn: expect.any(String),
            status: "draft",
            tenant: "root",
            TYPE: "cms.entry.l",
            values: {
                content: "Page 1 Page 1 title Suspendisse varius enim in eros elementum tristique.",
                data: {
                    createdBy,
                    createdOn: expect.any(String),
                    id: "64229f6fce15ca00086c890f#0001",
                    locked: true,
                    path: "/untitled-lfrz1twf",
                    pid: "64229f6fce15ca00086c890f",
                    savedOn: expect.any(String),
                    status: "published",
                    title: "Page 1",
                    version: 1
                },
                location: {
                    folderId: "ROOT"
                },
                title: "Page 1",
                type: "PbPage"
            },
            version: 1,
            webinyVersion: "0.0.0",
            created: expect.any(String),
            entity: "CmsEntries",
            modified: expect.any(String)
        },
        {
            PK: "T#root#L#en-US#CMS#CME#CME#64229f6fce15ca00086c890f",
            SK: "REV#0001",
            createdBy,
            createdOn: expect.any(String),
            entryId: "64229f6fce15ca00086c890f",
            GSI1_PK: "T#root#L#en-US#CMS#CME#M#acoSearchRecord#A",
            GSI1_SK: "64229f6fce15ca00086c890f#0001",
            id: "64229f6fce15ca00086c890f#0001",
            locale: "en-US",
            locked: false,
            meta: {},
            modelId: "acoSearchRecord",
            modifiedBy: createdBy,
            ownedBy: createdBy,
            savedOn: expect.any(String),
            status: "draft",
            tenant: "root",
            TYPE: "cms.entry",
            values: {
                content: "Page 1 Page 1 title Suspendisse varius enim in eros elementum tristique.",
                data: {
                    createdBy,
                    createdOn: expect.any(String),
                    id: "64229f6fce15ca00086c890f#0001",
                    locked: true,
                    path: "/untitled-lfrz1twf",
                    pid: "64229f6fce15ca00086c890f",
                    savedOn: expect.any(String),
                    status: "published",
                    title: "Page 1",
                    version: 1
                },
                location: {
                    folderId: "ROOT"
                },
                title: "Page 1",
                type: "PbPage"
            },
            version: 1,
            webinyVersion: "0.0.0",
            created: expect.any(String),
            entity: "CmsEntries",
            modified: expect.any(String)
        }
    ];
};
