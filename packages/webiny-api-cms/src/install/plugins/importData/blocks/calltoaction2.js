export default {
    id: "5c27a54ca0b03cc8d9e32fcf",
    name: "Call to action #2",
    type: "block",
    content: {
        data: {
            settings: {
                padding: {
                    advanced: true,
                    desktop: { top: 100, bottom: 100 },
                    mobile: { top: 15, bottom: 15, right: 15, left: 15 }
                },
                width: { value: "1000px" }
            }
        },
        elements: [
            {
                data: {
                    settings: {
                        margin: { desktop: { all: 0 }, mobile: { all: 0 } },
                        padding: { desktop: { all: 0 }, mobile: { all: 0 } }
                    }
                },
                elements: [
                    {
                        data: {
                            width: 100,
                            settings: {
                                margin: { desktop: { all: 0 }, mobile: { all: 0 } },
                                padding: { desktop: { all: 0 }, mobile: { all: 0 } }
                            }
                        },
                        elements: [
                            {
                                data: {
                                    text: {
                                        object: "value",
                                        document: {
                                            object: "document",
                                            data: {},
                                            nodes: [
                                                {
                                                    object: "block",
                                                    type: "h2",
                                                    data: { align: "center" },
                                                    nodes: [
                                                        {
                                                            object: "text",
                                                            leaves: [
                                                                {
                                                                    object: "leaf",
                                                                    text: "Call to Action",
                                                                    marks: []
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    },
                                    settings: { margin: { advanced: true, mobile: { bottom: 15 } } }
                                },
                                elements: [],
                                type: "cms-element-text"
                            },
                            {
                                data: {
                                    text: {
                                        object: "value",
                                        document: {
                                            object: "document",
                                            data: {},
                                            nodes: [
                                                {
                                                    object: "block",
                                                    type: "paragraph",
                                                    data: { align: "center" },
                                                    nodes: [
                                                        {
                                                            object: "text",
                                                            leaves: [
                                                                {
                                                                    object: "leaf",
                                                                    text:
                                                                        "Eiusmod est commodo fugiat ullamco nostrud nulla do. Duis ut ad excepteur fugiat do adipisicing anim laborum in cillum. Dolor consectetur tempor deserunt commodo id irure ea.",
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
                                        padding: {
                                            desktop: {
                                                all: 200,
                                                right: 300,
                                                left: 300,
                                                bottom: 0,
                                                top: 0
                                            },
                                            advanced: true
                                        },
                                        margin: { advanced: true, desktop: { top: 25, bottom: 50 } }
                                    }
                                },
                                elements: [],
                                type: "cms-element-text"
                            },
                            {
                                data: {
                                    text: {
                                        object: "value",
                                        document: {
                                            object: "document",
                                            data: {},
                                            nodes: [
                                                {
                                                    object: "block",
                                                    type: "button",
                                                    data: {},
                                                    nodes: [
                                                        {
                                                            object: "text",
                                                            leaves: [
                                                                {
                                                                    object: "leaf",
                                                                    text: "Download",
                                                                    marks: []
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    },
                                    type: "primary",
                                    icon: {
                                        id: ["fas", "download"],
                                        svg:
                                            '<svg width="12" viewBox="0 0 512 512"><path d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z" fill="currentColor"></path></svg>',
                                        width: "12",
                                        position: "right"
                                    },
                                    settings: {
                                        horizontalAlignFlex: "center",
                                        settings: {
                                            margin: { desktop: { all: 0 }, mobile: { all: 0 } },
                                            padding: { desktop: { all: 0 }, mobile: { all: 0 } }
                                        }
                                    }
                                },
                                elements: [],
                                type: "cms-element-button"
                            }
                        ],
                        type: "cms-element-column"
                    }
                ],
                type: "cms-element-row"
            }
        ],
        type: "cms-element-block"
    },
    preview: {
        name: "cms-element-5c27a54ca0b03cc8d9e32fcf_13o8jq9p9lnj.png",
        size: 35431,
        src: "http://localhost:9000/files/cms-element-5c27a54ca0b03cc8d9e32fcf_13o8jq9p9lnj.png",
        type: "image/png",
        width: 1000,
        height: 411
    },
    category: "cms-block-category-cta"
};
