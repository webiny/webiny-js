import React from "react";
import { Location } from "history";
import Page from "./Page";

type PageRouteProps = { location: Location };

function PageRoute({ location }: PageRouteProps) {
    const props: { url: string; id: string } = { url: null, id: null };
    props.url = location.pathname;
    const query = new URLSearchParams(location.search);
    props.id = query.get("preview");

    return <Page {...props} />;
}

export default PageRoute;

const heson = {
    pageBuilder: {
        page: {
            data: {
                id: "5c86c7564527eea07b295f9d",
                title: "Welcome to Webiny111",
                url: "/welcome-to-webiny",
                version: 1,
                publishedOn: "2020-02-11T18:38:26.701Z",
                snippet: null,
                content: {
                    id: "bRM0OvTBQ",
                    data: {},
                    elements: [
                        {
                            id: "DRJ1k209Aw",
                            data: {
                                settings: {
                                    width: { value: "1000px" },
                                    margin: {
                                        mobile: {
                                            top: 15,
                                            left: 15,
                                            right: 15,
                                            bottom: 15
                                        },
                                        desktop: {
                                            top: 25,
                                            left: 0,
                                            right: 0,
                                            bottom: 25
                                        },
                                        advanced: true
                                    },
                                    padding: {
                                        mobile: { all: 10 },
                                        desktop: { all: 0 }
                                    }
                                }
                            },
                            elements: [
                                {
                                    id: "mXp2AYjBAW",
                                    data: {
                                        settings: {
                                            margin: {
                                                desktop: { all: 0 },
                                                mobile: { all: 0 }
                                            },
                                            padding: {
                                                desktop: { all: 0 },
                                                mobile: { all: 0 }
                                            }
                                        }
                                    },
                                    elements: [
                                        {
                                            id: "9LoF-7PWRy",
                                            data: {
                                                width: 100,
                                                settings: {
                                                    margin: {
                                                        desktop: { all: 0 },
                                                        mobile: { all: 0 }
                                                    },
                                                    padding: {
                                                        desktop: { all: 0 },
                                                        mobile: { all: 0 }
                                                    }
                                                }
                                            },
                                            elements: [
                                                {
                                                    id: "8ViwYG1TL",
                                                    data: {
                                                        text: {
                                                            object: "value",
                                                            document: {
                                                                object: "document",
                                                                data: {},
                                                                nodes: [
                                                                    {
                                                                        object: "block",
                                                                        type: "h1",
                                                                        data: {
                                                                            align: "center"
                                                                        },
                                                                        nodes: [
                                                                            {
                                                                                object: "text",
                                                                                leaves: [
                                                                                    {
                                                                                        object:
                                                                                            "leaf",
                                                                                        text:
                                                                                            "Welcome to Webin11y",
                                                                                        marks: []
                                                                                    }
                                                                                ]
                                                                            }
                                                                        ]
                                                                    },
                                                                    {
                                                                        object: "block",
                                                                        type: "h3",
                                                                        data: {
                                                                            align: "center"
                                                                        },
                                                                        nodes: [
                                                                            {
                                                                                object: "text",
                                                                                leaves: [
                                                                                    {
                                                                                        object:
                                                                                            "leaf",
                                                                                        text:
                                                                                            "This is your new website. ",
                                                                                        marks: []
                                                                                    }
                                                                                ]
                                                                            }
                                                                        ]
                                                                    },
                                                                    {
                                                                        object: "block",
                                                                        type: "paragraph",
                                                                        data: {
                                                                            align: "center"
                                                                        },
                                                                        nodes: [
                                                                            {
                                                                                object: "text",
                                                                                leaves: [
                                                                                    {
                                                                                        object:
                                                                                            "leaf",
                                                                                        text:
                                                                                            "Below you will find few helpful articles to get you started.",
                                                                                        marks: []
                                                                                    }
                                                                                ]
                                                                            }
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        },
                                                        settings: {
                                                            margin: {
                                                                mobile: {
                                                                    top: 0,
                                                                    left: 0,
                                                                    right: 0,
                                                                    bottom: 15
                                                                },
                                                                desktop: {
                                                                    top: 0,
                                                                    left: 0,
                                                                    right: 0,
                                                                    bottom: 25
                                                                },
                                                                advanced: true
                                                            },
                                                            padding: {
                                                                desktop: { all: 0 },
                                                                mobile: { all: 0 }
                                                            }
                                                        }
                                                    },
                                                    elements: [],
                                                    path: "0.0.0.0.0",
                                                    type: "text"
                                                },
                                                {
                                                    id: "MbPbWes6q",
                                                    data: {
                                                        limit: 3,
                                                        component: "default",
                                                        settings: {
                                                            margin: {
                                                                desktop: { all: 0 },
                                                                mobile: { all: 0 }
                                                            },
                                                            padding: {
                                                                desktop: { all: 0 },
                                                                mobile: { all: 0 }
                                                            }
                                                        },
                                                        tagsRule: "ANY",
                                                        tags: ["demo"],
                                                        category: "5c436a2b4527ee6f2b8bf3d7",
                                                        resultsPerPage: 10
                                                    },
                                                    elements: [],
                                                    path: "0.0.0.0.1",
                                                    type: "pages-list"
                                                }
                                            ],
                                            path: "0.0.0.0",
                                            type: "column"
                                        }
                                    ],
                                    path: "0.0.0",
                                    type: "row"
                                }
                            ],
                            path: "0.0",
                            type: "block"
                        }
                    ],
                    path: "0",
                    type: "document"
                },
                createdBy: {
                    firstName: "kboaja",
                    lastName: "grande",
                    __typename: "SecurityUser"
                },
                settings: {
                    _empty: "",
                    general: {
                        image: null,
                        tags: ["page", "homepage"],
                        layout: "static",
                        __typename: "PbGeneralPageSettings"
                    },
                    seo: {
                        title: null,
                        description: null,
                        meta: [],
                        __typename: "PbSeoSettings"
                    },
                    social: {
                        image: null,
                        title: null,
                        description: null,
                        meta: [],
                        __typename: "PbSocialSettings"
                    },
                    __typename: "PbPageSettings"
                },
                category: {
                    id: "5c436a2b4527ee6f2b8bf3d7",
                    name: "Static",
                    __typename: "PbCategory"
                },
                __typename: "PbPage"
            },
            error: null,
            __typename: "PbPageResponse"
        },
        __typename: "PbQuery"
    }
};
