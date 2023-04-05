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

export const createDdbPagesData = () => {
    return [
        {
            PK: "T#root#L#en-US#PB#P#642d3f644d7cdc000821b67e",
            SK: "L",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    'id|e2BqxFH8H4|type|document|data|settings|elements|91eudXC1XO|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|Bol7kLmyfW|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|DOZwsXszAT|cell|size|asWyIzGneq|heading|text|typography|heading1|alignment|tag|h1|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Page+1","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}|path|csorhPDr6y|paragraph|paragraph1|p|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lorem+ipsum+dolor+sit+amet,+consectetur+adipiscing+elit.+Suspendisse+varius+enim+in+eros+elementum+tristique.+Duis+cursus,+mi+quis+viverra+ornare,+eros+dolor+interdum+nulla,+ut+commodo+diam+libero+vitae+erat.+","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|1J]|N|$A|Q]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]'
            },
            createdBy,
            createdOn: "2023-04-05T09:29:08.538Z",
            editor: "page-builder",
            id: "642d3f644d7cdc000821b67e#0001",
            locale: "en-US",
            locked: true,
            ownedBy: createdBy,
            path: "/untitled-lg3hm56i",
            pid: "642d3f644d7cdc000821b67e",
            publishedOn: "2023-04-05T09:32:01.638Z",
            savedOn: "2023-04-05T09:32:01.638Z",
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
            TYPE: "pb.page.l",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2023-04-05T09:32:01.639Z",
            _et: "PbPages",
            _md: "2023-04-05T09:32:01.639Z"
        },
        {
            PK: "T#root#L#en-US#PB#P#642d3f644d7cdc000821b67e",
            SK: "P",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    'id|e2BqxFH8H4|type|document|data|settings|elements|91eudXC1XO|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|Bol7kLmyfW|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|DOZwsXszAT|cell|size|asWyIzGneq|heading|text|typography|heading1|alignment|tag|h1|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Page+1","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}|path|csorhPDr6y|paragraph|paragraph1|p|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lorem+ipsum+dolor+sit+amet,+consectetur+adipiscing+elit.+Suspendisse+varius+enim+in+eros+elementum+tristique.+Duis+cursus,+mi+quis+viverra+ornare,+eros+dolor+interdum+nulla,+ut+commodo+diam+libero+vitae+erat.+","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|1J]|N|$A|Q]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]'
            },
            createdBy,
            createdOn: "2023-04-05T09:29:08.538Z",
            editor: "page-builder",
            id: "642d3f644d7cdc000821b67e#0001",
            locale: "en-US",
            locked: true,
            ownedBy: createdBy,
            path: "/untitled-lg3hm56i",
            pid: "642d3f644d7cdc000821b67e",
            publishedOn: "2023-04-05T09:32:01.638Z",
            savedOn: "2023-04-05T09:32:01.638Z",
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
            TYPE: "pb.page.p",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2023-04-05T09:32:01.640Z",
            _et: "PbPages",
            _md: "2023-04-05T09:32:01.640Z"
        },
        {
            PK: "T#root#L#en-US#PB#P#642d3f644d7cdc000821b67e",
            SK: "REV#0001",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    'id|e2BqxFH8H4|type|document|data|settings|elements|91eudXC1XO|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|Bol7kLmyfW|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|DOZwsXszAT|cell|size|asWyIzGneq|heading|text|typography|heading1|alignment|tag|h1|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Page+1","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}|path|csorhPDr6y|paragraph|paragraph1|p|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lorem+ipsum+dolor+sit+amet,+consectetur+adipiscing+elit.+Suspendisse+varius+enim+in+eros+elementum+tristique.+Duis+cursus,+mi+quis+viverra+ornare,+eros+dolor+interdum+nulla,+ut+commodo+diam+libero+vitae+erat.+","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|1J]|N|$A|Q]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]'
            },
            createdBy,
            createdOn: "2023-04-05T09:29:08.538Z",
            editor: "page-builder",
            id: "642d3f644d7cdc000821b67e#0001",
            locale: "en-US",
            locked: true,
            ownedBy: createdBy,
            path: "/untitled-lg3hm56i",
            pid: "642d3f644d7cdc000821b67e",
            publishedOn: "2023-04-05T09:32:01.638Z",
            savedOn: "2023-04-05T09:32:01.638Z",
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
            TYPE: "pb.page",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2023-04-05T09:32:01.638Z",
            _et: "PbPages",
            _md: "2023-04-05T09:32:01.638Z"
        },
        {
            PK: "T#root#L#en-US#PB#P#642d401c4d7cdc000821b681",
            SK: "L",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    'id|0IfuDmT6X0|type|document|data|settings|elements|XL5qJncB0f|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|UNeRdU7kiH|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|w5nveTu8Ei|cell|size|ZD9s7D5edJ|heading|text|typography|heading1|alignment|tag|h1|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Page+2","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}|path|OgjSSewUNo|paragraph|paragraph1|p|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lorem+ipsum+dolor+sit+amet,+consectetur+adipiscing+elit.+Nunc+ut+sem+vitae+risus+tristique+posuere.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|1J]|N|$A|Q]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]'
            },
            createdBy,
            createdOn: "2023-04-05T09:32:12.436Z",
            editor: "page-builder",
            id: "642d401c4d7cdc000821b681#0001",
            locale: "en-US",
            locked: false,
            ownedBy: createdBy,
            path: "/untitled-lg3hq32s",
            pid: "642d401c4d7cdc000821b681",
            savedOn: "2023-04-05T09:37:04.998Z",
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
            TYPE: "pb.page.l",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2023-04-05T09:37:05.018Z",
            _et: "PbPages",
            _md: "2023-04-05T09:37:05.018Z"
        },
        {
            PK: "T#root#L#en-US#PB#P#642d401c4d7cdc000821b681",
            SK: "REV#0001",
            category: "static",
            content: {
                compression: "jsonpack",
                content:
                    'id|0IfuDmT6X0|type|document|data|settings|elements|XL5qJncB0f|block|width|desktop|value|100%25|margin|top|0px|right|bottom|left|advanced|padding|all|10px|horizontalAlignFlex|center|verticalAlign|flex-start|UNeRdU7kiH|grid|1100px|cellsType|12|gridSettings|flexDirection|row|mobile-landscape|column|w5nveTu8Ei|cell|size|ZD9s7D5edJ|heading|text|typography|heading1|alignment|tag|h1|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Page+2","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}|path|OgjSSewUNo|paragraph|paragraph1|p|{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Lorem+ipsum+dolor+sit+amet,+consectetur+adipiscing+elit.+Nunc+ut+sem+vitae+risus+tristique+posuere.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}^C^^$0|1|2|3|4|$5|$]]|6|@$0|7|2|8|4|$5|$9|$A|$B|C]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|N|$A|O]|P|$A|Q]]]|6|@$0|R|2|S|4|$5|$9|$A|$B|T]]|D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|M]]|S|$U|V]|W|$A|$X|Y]|Z|$X|10]]|N|$A|Q]|P|$A|Q]]]|6|@$0|11|2|12|4|$5|$D|$A|$E|F|G|F|H|F|I|F|J|-1]]|K|$A|$L|F]]|S|$13|1J]|N|$A|Q]]]|6|@$0|14|2|15|4|$16|$A|$2|15|17|18|19|I|1A|1B]|4|$16|1C]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R|11]]|$0|1E|2|1F|4|$16|$A|$2|1F|17|1G|19|I|1A|1H]|4|$16|1I]]|5|$D|$A|$L|F]]|K|$A|$L|F]]]]|6|@]|1D|@1|7|R]]]|1D|@1|7|R]]]|1D|@1|7]]]|1D|@1]]]|1D|@]]'
            },
            createdBy,
            createdOn: "2023-04-05T09:32:12.436Z",
            editor: "page-builder",
            id: "642d401c4d7cdc000821b681#0001",
            locale: "en-US",
            locked: false,
            ownedBy: createdBy,
            path: "/untitled-lg3hq32s",
            pid: "642d401c4d7cdc000821b681",
            savedOn: "2023-04-05T09:37:04.998Z",
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
            TYPE: "pb.page",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2023-04-05T09:37:05.017Z",
            _et: "PbPages",
            _md: "2023-04-05T09:37:05.017Z"
        }
    ];
};

export const createDdbEsPagesData = () => {
    return [
        {
            PK: "T#root#L#en-US#PB#P#642d3f644d7cdc000821b67e",
            SK: "L",
            data: {
                category: "static",
                createdBy,
                createdOn: "2023-04-05T09:29:08.538Z",
                editor: "page-builder",
                id: "642d3f644d7cdc000821b67e#0001",
                image: null,
                latest: true,
                locale: "en-US",
                locked: true,
                ownedBy: createdBy,
                path: "/untitled-lg3hm56i",
                pid: "642d3f644d7cdc000821b67e",
                publishedOn: "2023-04-05T09:32:01.638Z",
                savedOn: "2023-04-05T09:32:01.638Z",
                snippet: null,
                status: "published",
                tags: null,
                tenant: "root",
                title: "Page 1",
                titleLC: "page 1",
                version: 1,
                webinyVersion: "0.0.0",
                __type: "page"
            },
            index: "root-en-us-page-builder",
            _ct: "2023-04-05T09:32:01.640Z",
            _et: "PbPagesEs",
            _md: "2023-04-05T09:32:01.640Z"
        },
        {
            PK: "T#root#L#en-US#PB#P#642d3f644d7cdc000821b67e",
            SK: "P",
            data: {
                category: "static",
                createdBy,
                createdOn: "2023-04-05T09:29:08.538Z",
                editor: "page-builder",
                id: "642d3f644d7cdc000821b67e#0001",
                image: null,
                locale: "en-US",
                locked: true,
                ownedBy: createdBy,
                path: "/untitled-lg3hm56i",
                pid: "642d3f644d7cdc000821b67e",
                published: true,
                publishedOn: "2023-04-05T09:32:01.638Z",
                savedOn: "2023-04-05T09:32:01.638Z",
                snippet: null,
                status: "published",
                tags: null,
                tenant: "root",
                title: "Page 1",
                titleLC: "page 1",
                version: 1,
                webinyVersion: "0.0.0",
                __type: "page"
            },
            index: "root-en-us-page-builder",
            _ct: "2023-04-05T09:32:01.640Z",
            _et: "PbPagesEs",
            _md: "2023-04-05T09:32:01.640Z"
        },
        {
            PK: "T#root#L#en-US#PB#P#642d401c4d7cdc000821b681",
            SK: "L",
            data: {
                category: "static",
                createdBy,
                createdOn: "2023-04-05T09:32:12.436Z",
                editor: "page-builder",
                id: "642d401c4d7cdc000821b681#0001",
                images: null,
                latest: true,
                locale: "en-US",
                locked: false,
                ownedBy: createdBy,
                path: "/untitled-lg3hq32s",
                pid: "642d401c4d7cdc000821b681",
                savedOn: "2023-04-05T09:37:04.998Z",
                snippet: null,
                status: "draft",
                tags: null,
                tenant: "root",
                title: "Page 2",
                titleLC: "page 2",
                version: 1,
                webinyVersion: "0.0.0",
                __type: "page"
            },
            index: "root-en-us-page-builder",
            _ct: "2023-04-05T09:37:05.038Z",
            _et: "PbPagesEs",
            _md: "2023-04-05T09:37:05.038Z"
        }
    ];
};

// const ddbCmsEntry = [
//     {
//         PK: "T#root#L#en-US#CMS#CME#642d3f644d7cdc000821b67e",
//         SK: "L",
//         createdBy: {
//             displayName: "Leonardo Giacone",
//             id: "642c43342d365e00087ef217",
//             type: "admin"
//         },
//         createdOn: "2023-04-05T09:29:08.578Z",
//         entryId: "642d3f644d7cdc000821b67e",
//         id: "642d3f644d7cdc000821b67e#0001",
//         locale: "en-US",
//         locked: false,
//         meta: {},
//         modelId: "acoSearchRecord",
//         modifiedBy: {
//             displayName: "Leonardo Giacone",
//             id: "642c43342d365e00087ef217",
//             type: "admin"
//         },
//         ownedBy: {
//             displayName: "Leonardo Giacone",
//             id: "642c43342d365e00087ef217",
//             type: "admin"
//         },
//         savedOn: "2023-04-05T09:32:01.738Z",
//         status: "draft",
//         tenant: "root",
//         TYPE: "L",
//         values: {
//             content:
//                 "Page 1 Page 1 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.",
//             data: {
//                 createdBy: {
//                     displayName: "Leonardo Giacone",
//                     id: "642c43342d365e00087ef217",
//                     type: "admin"
//                 },
//                 createdOn: "2023-04-05T09:29:08.538Z",
//                 id: "642d3f644d7cdc000821b67e#0001",
//                 locked: true,
//                 path: "/untitled-lg3hm56i",
//                 pid: "642d3f644d7cdc000821b67e",
//                 savedOn: "2023-04-05T09:32:01.638Z",
//                 status: "published",
//                 title: "Page 1",
//                 version: 1
//             },
//             location: {
//                 folderId: "ROOT"
//             },
//             title: "Page 1",
//             type: "PbPage"
//         },
//         version: 1,
//         webinyVersion: "0.0.0-unstable.b02d94bba0",
//         _ct: "2023-04-05T09:32:01.755Z",
//         _et: "CmsEntries",
//         _md: "2023-04-05T09:32:01.755Z"
//     },
//     {
//         PK: "T#root#L#en-US#CMS#CME#642d3f644d7cdc000821b67e",
//         SK: "REV#0001",
//         createdBy: {
//             displayName: "Leonardo Giacone",
//             id: "642c43342d365e00087ef217",
//             type: "admin"
//         },
//         createdOn: "2023-04-05T09:29:08.578Z",
//         entryId: "642d3f644d7cdc000821b67e",
//         id: "642d3f644d7cdc000821b67e#0001",
//         locale: "en-US",
//         locked: false,
//         meta: {},
//         modelId: "acoSearchRecord",
//         modifiedBy: {
//             displayName: "Leonardo Giacone",
//             id: "642c43342d365e00087ef217",
//             type: "admin"
//         },
//         ownedBy: {
//             displayName: "Leonardo Giacone",
//             id: "642c43342d365e00087ef217",
//             type: "admin"
//         },
//         savedOn: "2023-04-05T09:32:01.738Z",
//         status: "draft",
//         tenant: "root",
//         TYPE: "cms.entry",
//         values: {
//             content:
//                 "Page 1 Page 1 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.",
//             data: {
//                 createdBy: {
//                     displayName: "Leonardo Giacone",
//                     id: "642c43342d365e00087ef217",
//                     type: "admin"
//                 },
//                 createdOn: "2023-04-05T09:29:08.538Z",
//                 id: "642d3f644d7cdc000821b67e#0001",
//                 locked: true,
//                 path: "/untitled-lg3hm56i",
//                 pid: "642d3f644d7cdc000821b67e",
//                 savedOn: "2023-04-05T09:32:01.638Z",
//                 status: "published",
//                 title: "Page 1",
//                 version: 1
//             },
//             location: {
//                 folderId: "ROOT"
//             },
//             title: "Page 1",
//             type: "PbPage"
//         },
//         version: 1,
//         webinyVersion: "0.0.0-unstable.b02d94bba0",
//         _ct: "2023-04-05T09:32:01.755Z",
//         _et: "CmsEntries",
//         _md: "2023-04-05T09:32:01.755Z"
//     }
// ];

// const ddbEsCmsEntry = [
//     {
//         PK: "T#root#L#en-US#CMS#CME#642d3f644d7cdc000821b67e",
//         SK: "L",
//         data: {
//             compression: "gzip",
//             value: "H4sIAAAAAAAAA7VUTW/bMAz9K4J2dTzHdpImx2HDUKBYi7Yr0F0KWmISYrLk6iNFEPS/j3aSIhuKrpfCB0vU4xM/HrWTrdNozrVcSFDuBsGr9TUq57XM5AZ9IGflYpzJABvUl7yWZVFWo6IeFZPbYr6oykUxzmfV2S92ME6BQcagHf28YUOIEFNgg/awjGxoMYJc7J6ZHExCPtrJuO16n6vmClbImEhxIOm3YswG5WxEG19M4vC7cB5bQV1IrdDOOC8CRQF8RybYJ6CKGJMXoKmjoMiuBBqKubhJoUOrKQQUG/CUgkBLTGUFescbgy1fyLTRU4j0mDAXXxMFoZIPKWSiJfHY7zfERfIgnLfgMdu772MhDtpr5rDJGMhEihxUy/V2QhO0wlDDaGaIgOwHMT9UMA4138mlMxr90Jvry8tb+cxVUx4hov6yPSkc6JYs+3I+nYHtDy4AWy/QcUh82Xfiztq+sNRTTetS1VVVl7qaTrAoirMZLsvxTDI75+y35weUrpbTutYzpVWPKsfNdDa0By0MzfDO9S09hPSKNsr5ojjLJ7OjNn4jUy/BBMyke7IflsYTNmS3d0f1yiLnb5Qsq7ExmDdFqed100BxQvZqtp942QuQm0ZLOsb79v3vSOCvhDleD093L9NwogA+0jDMy/vC7N5EvTpZHyqn/ypj/2q8/bRMD6DjS9KlxlBY478P1FFf0SeWVwdxzeDPyQ4565FZVet2MqVhigyHFeIRe3t/9Y2xqg35MAC5YeqHh0M5Ts3PfwDo+L9CMAUAAA=="
//         },
//         index: "root-headless-cms-en-us-acosearchrecord",
//         _ct: "2023-04-05T09:32:01.756Z",
//         _et: "CmsEntriesElasticsearch",
//         _md: "2023-04-05T09:32:01.756Z"
//     }
// ];

// const dataValue = {
//     modelId: "acoSearchRecord",
//     version: 1,
//     savedOn: "2023-04-05T09:32:01.738Z",
//     locale: "en-US",
//     status: "draft",
//     meta: {},
//     values: {
//         type: "PbPage",
//         title: "Page 1",
//         content:
//             "Page 1 Page 1 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.",
//         location: { folderId: "ROOT" }
//     },
//     createdBy: { type: "admin", displayName: "Leonardo Giacone", id: "642c43342d365e00087ef217" },
//     entryId: "642d3f644d7cdc000821b67e",
//     tenant: "root",
//     createdOn: "2023-04-05T09:29:08.578Z",
//     locked: false,
//     ownedBy: { type: "admin", displayName: "Leonardo Giacone", id: "642c43342d365e00087ef217" },
//     webinyVersion: "0.0.0-unstable.b02d94bba0",
//     id: "642d3f644d7cdc000821b67e#0001",
//     modifiedBy: { id: "642c43342d365e00087ef217", displayName: "Leonardo Giacone", type: "admin" },
//     rawValues: {
//         location: {},
//         data: {
//             id: "642d3f644d7cdc000821b67e#0001",
//             pid: "642d3f644d7cdc000821b67e",
//             title: "Page 1",
//             createdBy: {
//                 type: "admin",
//                 displayName: "Leonardo Giacone",
//                 id: "642c43342d365e00087ef217"
//             },
//             createdOn: "2023-04-05T09:29:08.538Z",
//             savedOn: "2023-04-05T09:32:01.638Z",
//             status: "published",
//             version: 1,
//             locked: true,
//             path: "/untitled-lg3hm56i"
//         }
//     },
//     latest: true,
//     TYPE: "cms.entry.l",
//     __type: "cms.entry.l"
// };
