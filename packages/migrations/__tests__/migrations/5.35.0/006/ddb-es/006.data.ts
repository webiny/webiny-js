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
