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
        },
        {
            PK: "T#root#L#en-US#PB#P",
            SK: "642406c52a40e70008fee21d",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|FOT7NQ3gam|type|document|data|settings|elements|G47wKdHPBI|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|keUeUenx3P|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|Qt1p8OlyyH|cell|size|XD7a4LnuWx|heading|text|typography|heading1|alignment|tag|h1|Page+2|path|ozFJzuQseJ|paragraph|paragraph1|p|Aenean+faucibus+nibh+et+justo+cursus+id+rutrum+lorem+imperdiet.+Nunc+ut+sem+vitae+risus+tristique+posuere.|MLNrSLqBoU|list|div|<ul>\n++++++++++++++++++++<li>List+item+1</li>\n++++++++++++++++++++<li>List+item+2</li>\n++++++++++++++++++++<li>List+item+3</li>\n++++++++++++++++</ul>|FhLTsIncSt|quote|<blockquote><q>Block+Quote</q></blockquote>|nZOfqLWtvc|image|file|6424072bfb907800086373fb|src|https://d10tqewv85yaar.cloudfront.net/files/8lfthvnc3-t_pzvyZZ_400x400.jpg|title|Cat+roll|link|href^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|20]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1J|2|1K|4|$16|$A|$2|1K|17|1K|19|I|1A|1L]|4|$16|1M]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1N|2|1O|4|$16|$A|$2|1O|17|1O|19|I|1A|1L]|4|$16|1P]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1Q|2|1R|4|$5|$N|$A|O]|D|$A|$L|F]]|K|$A|$L|F]]]|1R|$1S|$0|1T|1U|1V]|1W|1X]|1Y|$1Z|-4]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T09:37:09.588Z",
            editor: "page-builder",
            GSI1_PK: "T#root#L#en-US#PB#PATH",
            GSI1_SK: "/untitled-lfththow",
            id: "642406c52a40e70008fee21d#0001",
            locale: "en-US",
            locked: true,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lfththow",
            pid: "642406c52a40e70008fee21d",
            publishedOn: "2023-03-29T09:52:16.643Z",
            savedOn: "2023-03-29T09:52:16.643Z",
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
            title: "Page 2",
            titleLC: "page 2",
            TYPE: "pb.page.p",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T09:52:16.653Z",
            _et: "PbPages",
            _md: "2023-03-29T09:52:16.653Z"
        },
        {
            PK: "T#root#L#en-US#PB#642406c52a40e70008fee21d",
            SK: "1",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|FOT7NQ3gam|type|document|data|settings|elements|G47wKdHPBI|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|keUeUenx3P|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|Qt1p8OlyyH|cell|size|XD7a4LnuWx|heading|text|typography|heading1|alignment|tag|h1|Page+2|path|ozFJzuQseJ|paragraph|paragraph1|p|Aenean+faucibus+nibh+et+justo+cursus+id+rutrum+lorem+imperdiet.+Nunc+ut+sem+vitae+risus+tristique+posuere.|MLNrSLqBoU|list|div|<ul>\n++++++++++++++++++++<li>List+item+1</li>\n++++++++++++++++++++<li>List+item+2</li>\n++++++++++++++++++++<li>List+item+3</li>\n++++++++++++++++</ul>|FhLTsIncSt|quote|<blockquote><q>Block+Quote</q></blockquote>|nZOfqLWtvc|image|file|6424072bfb907800086373fb|src|https://d10tqewv85yaar.cloudfront.net/files/8lfthvnc3-t_pzvyZZ_400x400.jpg|title|Cat+roll|link|href^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|20]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1J|2|1K|4|$16|$A|$2|1K|17|1K|19|I|1A|1L]|4|$16|1M]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1N|2|1O|4|$16|$A|$2|1O|17|1O|19|I|1A|1L]|4|$16|1P]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1Q|2|1R|4|$5|$N|$A|O]|D|$A|$L|F]]|K|$A|$L|F]]]|1R|$1S|$0|1T|1U|1V]|1W|1X]|1Y|$1Z|-4]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T09:37:09.588Z",
            editor: "page-builder",
            id: "642406c52a40e70008fee21d#0001",
            locale: "en-US",
            locked: true,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lfththow",
            pid: "642406c52a40e70008fee21d",
            publishedOn: "2023-03-29T09:52:16.643Z",
            savedOn: "2023-03-29T09:52:16.643Z",
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
            title: "Page 2",
            titleLC: "page 2",
            TYPE: "pb.page",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T09:52:16.644Z",
            _et: "PbPages",
            _md: "2023-03-29T09:52:16.644Z"
        },
        {
            PK: "T#root#L#en-US#PB#642406c52a40e70008fee21d",
            SK: "2",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|FOT7NQ3gam|type|document|data|settings|elements|G47wKdHPBI|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|keUeUenx3P|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|Qt1p8OlyyH|cell|size|XD7a4LnuWx|heading|text|typography|heading1|alignment|tag|h1|Page+2|path|ozFJzuQseJ|paragraph|paragraph1|p|Aenean+faucibus+nibh+et+justo+cursus+id+rutrum+lorem+imperdiet.+Nunc+ut+sem+vitae+risus+tristique+posuere.|MLNrSLqBoU|list|div|<ul>\n++++++++++++++++++++<li>List+item+1</li>\n++++++++++++++++++++<li>List+item+2</li>\n++++++++++++++++++++<li>List+item+3</li>\n++++++++++++++++</ul>|FhLTsIncSt|quote|<blockquote><q>Block+Quote</q></blockquote>|nZOfqLWtvc|image|file|6424072bfb907800086373fb|src|https://d10tqewv85yaar.cloudfront.net/files/8lfthvnc3-t_pzvyZZ_400x400.jpg|title|Cat+roll|link|href|CxuIVTo4d3|button|default|buttonText|Demo+button|action|newTab|actionType^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|28]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1J|2|1K|4|$16|$A|$2|1K|17|1K|19|I|1A|1L]|4|$16|1M]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1N|2|1O|4|$16|$A|$2|1O|17|1O|19|I|1A|1L]|4|$16|1P]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1Q|2|1R|4|$5|$N|$A|O]|D|$A|$L|F]]|K|$A|$L|F]]]|1R|$1S|$0|1T|1U|1V]|1W|1X]|1Y|$1Z|-4]]|6|@]|1D|@1|7|R|11]]|$0|20|2|21|4|$2|22|23|24|5|$D|$A|$L|F]]|N|$A|O]]|25|$1Z|-4|26|-2|27|1Y]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdFrom: "642406c52a40e70008fee21d#0001",
            createdOn: "2023-03-29T09:52:22.978Z",
            editor: "page-builder",
            id: "642406c52a40e70008fee21d#0002",
            locale: "en-US",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lfththow",
            pid: "642406c52a40e70008fee21d",
            savedOn: "2023-03-29T09:52:46.033Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 2",
            titleLC: "page 2",
            TYPE: "pb.page",
            version: 2,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T09:52:46.095Z",
            _et: "PbPages",
            _md: "2023-03-29T09:52:46.095Z"
        },
        {
            PK: "T#root#L#en-US#PB#L",
            SK: "642406c52a40e70008fee21d",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|FOT7NQ3gam|type|document|data|settings|elements|G47wKdHPBI|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|keUeUenx3P|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|Qt1p8OlyyH|cell|size|XD7a4LnuWx|heading|text|typography|heading1|alignment|tag|h1|Page+2|path|ozFJzuQseJ|paragraph|paragraph1|p|Aenean+faucibus+nibh+et+justo+cursus+id+rutrum+lorem+imperdiet.+Nunc+ut+sem+vitae+risus+tristique+posuere.|MLNrSLqBoU|list|div|<ul>\n++++++++++++++++++++<li>List+item+1</li>\n++++++++++++++++++++<li>List+item+2</li>\n++++++++++++++++++++<li>List+item+3</li>\n++++++++++++++++</ul>|FhLTsIncSt|quote|<blockquote><q>Block+Quote</q></blockquote>|nZOfqLWtvc|image|file|6424072bfb907800086373fb|src|https://d10tqewv85yaar.cloudfront.net/files/8lfthvnc3-t_pzvyZZ_400x400.jpg|title|Cat+roll|link|href|CxuIVTo4d3|button|default|buttonText|Demo+button|action|newTab|actionType^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|28]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1J|2|1K|4|$16|$A|$2|1K|17|1K|19|I|1A|1L]|4|$16|1M]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1N|2|1O|4|$16|$A|$2|1O|17|1O|19|I|1A|1L]|4|$16|1P]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1Q|2|1R|4|$5|$N|$A|O]|D|$A|$L|F]]|K|$A|$L|F]]]|1R|$1S|$0|1T|1U|1V]|1W|1X]|1Y|$1Z|-4]]|6|@]|1D|@1|7|R|11]]|$0|20|2|21|4|$2|22|23|24|5|$D|$A|$L|F]]|N|$A|O]]|25|$1Z|-4|26|-2|27|1Y]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdFrom: "642406c52a40e70008fee21d#0001",
            createdOn: "2023-03-29T09:52:22.978Z",
            editor: "page-builder",
            id: "642406c52a40e70008fee21d#0002",
            locale: "en-US",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lfththow",
            pid: "642406c52a40e70008fee21d",
            savedOn: "2023-03-29T09:52:46.033Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 2",
            titleLC: "page 2",
            TYPE: "pb.page.l",
            version: 2,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T09:52:46.095Z",
            _et: "PbPages",
            _md: "2023-03-29T09:52:46.095Z"
        },
        {
            PK: "T#root#L#en-US#PB#64240c026a25550008918146",
            SK: "1",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|lp1q0escIo|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T09:59:30.365Z",
            editor: "page-builder",
            id: "64240c026a25550008918146#0001",
            locale: "en-US",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftim88r",
            pid: "64240c026a25550008918146",
            savedOn: "2023-03-29T09:59:37.541Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 3",
            titleLC: "page 3",
            TYPE: "pb.page",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T09:59:37.565Z",
            _et: "PbPages",
            _md: "2023-03-29T09:59:37.565Z"
        },
        {
            PK: "T#root#L#en-US#PB#L",
            SK: "64240c026a25550008918146",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|lp1q0escIo|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T09:59:30.365Z",
            editor: "page-builder",
            id: "64240c026a25550008918146#0001",
            locale: "en-US",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftim88r",
            pid: "64240c026a25550008918146",
            savedOn: "2023-03-29T09:59:37.541Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 3",
            titleLC: "page 3",
            TYPE: "pb.page.l",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T09:59:37.565Z",
            _et: "PbPages",
            _md: "2023-03-29T09:59:37.565Z"
        },
        {
            PK: "T#root#L#en-US#PB#L",
            SK: "64240c0d6a25550008918147",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|r2pO3PhkZ5|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T09:59:41.577Z",
            editor: "page-builder",
            id: "64240c0d6a25550008918147#0001",
            locale: "en-US",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftimgw8",
            pid: "64240c0d6a25550008918147",
            savedOn: "2023-03-29T09:59:46.483Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 4",
            titleLC: "page 4",
            TYPE: "pb.page.l",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T09:59:46.517Z",
            _et: "PbPages",
            _md: "2023-03-29T09:59:46.517Z"
        },
        {
            PK: "T#root#L#en-US#PB#64240c0d6a25550008918147",
            SK: "1",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|r2pO3PhkZ5|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T09:59:41.577Z",
            editor: "page-builder",
            id: "64240c0d6a25550008918147#0001",
            locale: "en-US",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftimgw8",
            pid: "64240c0d6a25550008918147",
            savedOn: "2023-03-29T09:59:46.483Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 4",
            titleLC: "page 4",
            TYPE: "pb.page",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T09:59:46.517Z",
            _et: "PbPages",
            _md: "2023-03-29T09:59:46.517Z"
        },
        {
            PK: "T#root#L#en-US#PB#L",
            SK: "64240c156a25550008918148",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|9jHgMYRj3w|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T09:59:49.797Z",
            editor: "page-builder",
            id: "64240c156a25550008918148#0001",
            locale: "en-US",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftimn8k",
            pid: "64240c156a25550008918148",
            savedOn: "2023-03-29T09:59:55.256Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 5",
            titleLC: "page 5",
            TYPE: "pb.page.l",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T09:59:55.277Z",
            _et: "PbPages",
            _md: "2023-03-29T09:59:55.277Z"
        },
        {
            PK: "T#root#L#en-US#PB#64240c156a25550008918148",
            SK: "1",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|9jHgMYRj3w|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T09:59:49.797Z",
            editor: "page-builder",
            id: "64240c156a25550008918148#0001",
            locale: "en-US",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftimn8k",
            pid: "64240c156a25550008918148",
            savedOn: "2023-03-29T09:59:55.256Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 5",
            titleLC: "page 5",
            TYPE: "pb.page",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T09:59:55.277Z",
            _et: "PbPages",
            _md: "2023-03-29T09:59:55.277Z"
        },
        {
            PK: "T#root#L#en-US#PB#64240c1e6a25550008918149",
            SK: "1",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|kCkoMujQ1o|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T09:59:58.533Z",
            editor: "page-builder",
            id: "64240c1e6a25550008918149#0001",
            locale: "de-DE",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftimtz9",
            pid: "64240c1e6a25550008918149",
            savedOn: "2023-03-29T10:00:03.640Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 6",
            titleLC: "page 6",
            TYPE: "pb.page",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T10:00:03.650Z",
            _et: "PbPages",
            _md: "2023-03-29T10:00:03.650Z"
        },
        {
            PK: "T#root#L#de-DE#PB#L",
            SK: "64240c1e6a25550008918149",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|kCkoMujQ1o|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T09:59:58.533Z",
            editor: "page-builder",
            id: "64240c1e6a25550008918149#0001",
            locale: "en-US",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftimtz9",
            pid: "64240c1e6a25550008918149",
            savedOn: "2023-03-29T10:00:03.640Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 6",
            titleLC: "page 6",
            TYPE: "pb.page.l",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T10:00:03.650Z",
            _et: "PbPages",
            _md: "2023-03-29T10:00:03.650Z"
        },
        {
            PK: "T#root#L#de-DE#PB#L",
            SK: "64240c1e6a25550008918149",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|kCkoMujQ1o|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T09:59:58.533Z",
            editor: "page-builder",
            id: "64240c1e6a25550008918149#0001",
            locale: "de-DE",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftimtz9",
            pid: "64240c1e6a25550008918149",
            savedOn: "2023-03-29T10:00:03.640Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 6",
            titleLC: "page 6",
            TYPE: "pb.page.l",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T10:00:03.650Z",
            _et: "PbPages",
            _md: "2023-03-29T10:00:03.650Z"
        },
        {
            PK: "T#root#L#de-DE#PB#64240c276a2555000891814a",
            SK: "1",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|Rgv5ev8tZh|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T10:00:07.197Z",
            editor: "page-builder",
            id: "64240c276a2555000891814a#0001",
            locale: "de-DE",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftin0nw",
            pid: "64240c276a2555000891814a",
            savedOn: "2023-03-29T10:00:13.023Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 7",
            titleLC: "page 7",
            TYPE: "pb.page",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T10:00:13.042Z",
            _et: "PbPages",
            _md: "2023-03-29T10:00:13.042Z"
        },
        {
            PK: "T#root#L#de-DE#PB#L",
            SK: "64240c276a2555000891814a",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|Rgv5ev8tZh|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T10:00:07.197Z",
            editor: "page-builder",
            id: "64240c276a2555000891814a#0001",
            locale: "de-DE",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftin0nw",
            pid: "64240c276a2555000891814a",
            savedOn: "2023-03-29T10:00:13.023Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 7",
            titleLC: "page 7",
            TYPE: "pb.page.l",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T10:00:13.042Z",
            _et: "PbPages",
            _md: "2023-03-29T10:00:13.042Z"
        },
        {
            PK: "T#root#L#fr-FR#PB#L",
            SK: "64240c306a2555000891814b",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|w5NluYIkUJ|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T10:00:16.142Z",
            editor: "page-builder",
            id: "64240c306a2555000891814b#0001",
            locale: "fr-FR",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftin7kd",
            pid: "64240c306a2555000891814b",
            savedOn: "2023-03-29T10:00:21.181Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 8",
            titleLC: "page 8",
            TYPE: "pb.page.l",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T10:00:21.197Z",
            _et: "PbPages",
            _md: "2023-03-29T10:00:21.197Z"
        },
        {
            PK: "T#root#L#fr-FR#PB#64240c306a2555000891814b",
            SK: "1",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|w5NluYIkUJ|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T10:00:16.142Z",
            editor: "page-builder",
            id: "64240c306a2555000891814b#0001",
            locale: "fr-FR",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftin7kd",
            pid: "64240c306a2555000891814b",
            savedOn: "2023-03-29T10:00:21.181Z",
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
            status: "draft",
            tenant: "root",
            title: "Page 8",
            titleLC: "page 8",
            TYPE: "pb.page",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T10:00:21.197Z",
            _et: "PbPages",
            _md: "2023-03-29T10:00:21.197Z"
        },
        {
            PK: "T#otherTenant#L#de-DE#PB#64240c386a2555000891814c",
            SK: "1",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|VOYIMJbmls|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T10:00:24.698Z",
            editor: "page-builder",
            id: "64240c386a2555000891814c#0001",
            locale: "de-DE",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftine61",
            pid: "64240c386a2555000891814c",
            savedOn: "2023-03-29T10:00:29.817Z",
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
            status: "draft",
            tenant: "otherTenant",
            title: "Page 9",
            titleLC: "page 9",
            TYPE: "pb.page",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T10:00:29.836Z",
            _et: "PbPages",
            _md: "2023-03-29T10:00:29.836Z"
        },
        {
            PK: "T#otherTenant#L#de-DE#PB#L",
            SK: "64240c386a2555000891814c",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|VOYIMJbmls|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T10:00:24.698Z",
            editor: "page-builder",
            id: "64240c386a2555000891814c#0001",
            locale: "de-DE",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftine61",
            pid: "64240c386a2555000891814c",
            savedOn: "2023-03-29T10:00:29.817Z",
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
            status: "draft",
            tenant: "otherTenant",
            title: "Page 9",
            titleLC: "page 9",
            TYPE: "pb.page.l",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T10:00:29.837Z",
            _et: "PbPages",
            _md: "2023-03-29T10:00:29.837Z"
        },
        {
            PK: "T#otherTenant#L#fr-FR#PB#L",
            SK: "64240c416a2555000891814d",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|iQZiPRF1kL|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T10:00:33.958Z",
            editor: "page-builder",
            id: "64240c416a2555000891814d#0001",
            locale: "fr-FR",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftinlb9",
            pid: "64240c416a2555000891814d",
            savedOn: "2023-03-29T10:00:39.123Z",
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
            status: "draft",
            tenant: "otherTenant",
            title: "Page 10",
            titleLC: "page 10",
            TYPE: "pb.page.l",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T10:00:39.143Z",
            _et: "PbPages",
            _md: "2023-03-29T10:00:39.143Z"
        },
        {
            PK: "T#otherTenant#L#fr-FR#PB#64240c416a2555000891814d",
            SK: "1",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    "id|iQZiPRF1kL|type|document|data|settings|elements|path^^^$0|1|2|3|4|$5|$]]|6|@]|7|@]]"
            },
            createdBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            createdOn: "2023-03-29T10:00:33.958Z",
            editor: "page-builder",
            id: "64240c416a2555000891814d#0001",
            locale: "fr-FR",
            locked: false,
            ownedBy: {
                displayName: "Leonardo Giacone",
                id: "172d2b80-d554-439e-ad68-445b1486e60a",
                type: "admin"
            },
            path: "/untitled-lftinlb9",
            pid: "64240c416a2555000891814d",
            savedOn: "2023-03-29T10:00:39.123Z",
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
            status: "draft",
            tenant: "otherTenant",
            title: "Page 10",
            titleLC: "page 10",
            TYPE: "pb.page",
            version: 1,
            webinyVersion: "5.34.7",
            _ct: "2023-03-29T10:00:39.143Z",
            _et: "PbPages",
            _md: "2023-03-29T10:00:39.143Z"
        }
        // {
        //     PK: "T#root#L#en-US#PB#P#6425bf093a2f8e0008b49dbf",
        //     SK: "L",
        //     data: {
        //         category: "static",
        //         createdBy: {
        //             displayName: "Leonardo Giacone",
        //             id: "1c7efeeb-17fb-4dfd-bfdd-b34d92a43097",
        //             type: "admin"
        //         },
        //         createdOn: "2023-03-30T16:55:37.892Z",
        //         editor: "page-builder",
        //         id: "6425bf093a2f8e0008b49dbf#0001",
        //         images: {
        //             general: null
        //         },
        //         latest: true,
        //         locale: "en-US",
        //         locked: true,
        //         ownedBy: {
        //             displayName: "Leonardo Giacone",
        //             id: "1c7efeeb-17fb-4dfd-bfdd-b34d92a43097",
        //             type: "admin"
        //         },
        //         path: "/welcome-to-webiny",
        //         pid: "6425bf093a2f8e0008b49dbf",
        //         publishedOn: "2023-03-30T16:55:38.312Z",
        //         savedOn: "2023-03-30T16:55:38.312Z",
        //         snippet: null,
        //         status: "published",
        //         tags: [],
        //         tenant: "root",
        //         title: "Welcome to Webiny",
        //         titleLC: "welcome to webiny",
        //         version: 1,
        //         webinyVersion: "5.34.7",
        //         __type: "page"
        //     },
        //
        //     index: "root-en-us-page-builder",
        //     _ct: "2023-03-30T16:55:38.313Z",
        //     _et: "PbPagesEs",
        //     _md: "2023-03-30T16:55:38.313Z"
        // },
        // {
        //     PK: "T#root#L#en-US#PB#P#6425bf093a2f8e0008b49dbf",
        //     SK: "P",
        //     data: {
        //         category: "static",
        //         createdBy: {
        //             displayName: "Leonardo Giacone",
        //             id: "1c7efeeb-17fb-4dfd-bfdd-b34d92a43097",
        //             type: "admin"
        //         },
        //         createdOn: "2023-03-30T16:55:37.892Z",
        //         editor: "page-builder",
        //         id: "6425bf093a2f8e0008b49dbf#0001",
        //         images: {
        //             general: null
        //         },
        //         locale: "en-US",
        //         locked: true,
        //         ownedBy: {
        //             displayName: "Leonardo Giacone",
        //             id: "1c7efeeb-17fb-4dfd-bfdd-b34d92a43097",
        //             type: "admin"
        //         },
        //         path: "/welcome-to-webiny",
        //         pid: "6425bf093a2f8e0008b49dbf",
        //         published: true,
        //         publishedOn: "2023-03-30T16:55:38.312Z",
        //         savedOn: "2023-03-30T16:55:38.312Z",
        //         snippet: null,
        //         status: "published",
        //         tags: [],
        //         tenant: "root",
        //         title: "Welcome to Webiny",
        //         titleLC: "welcome to webiny",
        //         version: 1,
        //         webinyVersion: "5.34.7",
        //         __type: "page"
        //     },
        //     index: "root-en-us-page-builder",
        //     _ct: "2023-03-30T16:55:38.313Z",
        //     _et: "PbPagesEs",
        //     _md: "2023-03-30T16:55:38.313Z"
        // }
    ];
};
