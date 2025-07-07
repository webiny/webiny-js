import { Document } from "~/sdk/types";

export default {
    properties: {
        title: "Preview Page",
        path: "/page-1"
    },
    bindings: {
        root: {
            inputs: {
                children: {
                    type: "slot",
                    list: true,
                    static: ["oa0f4v521u3e0xzn8aztf"]
                }
            }
        },
        oa0f4v521u3e0xzn8aztf: {
            inputs: {
                text: {
                    id: "v9za1vzxfhy9est4pqjzh",
                    static: "Examine she brother prudent add day ham. Far stairs now coming bed oppose hunted become his. You zealously departure had procuring suspicion. Books whose front would purse if be do decay. Quitting you way formerly disposed perceive ladyship are. Common turned boy direct and yet.",
                    type: "longText",
                    list: false
                },
                image: {
                    id: "mtejyilosazdfa6ahneqq",
                    static: "https://dc4s05sapah2w.cloudfront.net/files/685d34049dd930000222d961/9l9iaffck-6.jpeg",
                    type: "text",
                    list: false
                }
            },
            styles: {},
            metadata: {
                "inputs/mtejyilosazdfa6ahneqq/image/desktop": {
                    id: "685d34049dd930000222d961",
                    name: "9l9iaffck-6.jpeg",
                    size: 403353,
                    mimeType: "image/jpeg",
                    url: "https://dc4s05sapah2w.cloudfront.net/files/685d34049dd930000222d961/9l9iaffck-6.jpeg"
                },
                "inputs/mtejyilosazdfa6ahneqq/image/tablet": {
                    id: "685d33fd9dd930000222d935",
                    name: "9l9iaffc2-5.jpeg",
                    size: 213715,
                    mimeType: "image/jpeg",
                    url: "https://dc4s05sapah2w.cloudfront.net/files/685d33fd9dd930000222d935/9l9iaffc2-5.jpeg"
                }
            },
            overrides: {
                tablet: {
                    inputs: {
                        image: {
                            id: "mtejyilosazdfa6ahneqq",
                            static: "https://dc4s05sapah2w.cloudfront.net/files/685d33fd9dd930000222d935/9l9iaffc2-5.jpeg",
                            type: "text",
                            list: false
                        }
                    }
                }
            }
        }
    },
    state: {},
    elements: {
        root: {
            type: "Webiny/Element",
            id: "root",
            component: {
                name: "Webiny/Root"
            }
        },
        oa0f4v521u3e0xzn8aztf: {
            type: "Webiny/Element",
            id: "oa0f4v521u3e0xzn8aztf",
            parent: {
                id: "root",
                slot: "children"
            },
            component: {
                name: "Webiny/SimpleText"
            }
        }
    }
} as any as Document;
