export default {
    id: "5c27a674a0b03cc97f75b0e4",
    name: "Call to action #5",
    type: "block",
    content: {
        data: {
            settings: {
                padding: {
                    advanced: true,
                    desktop: { top: 0, bottom: 0 },
                    mobile: { top: 20, bottom: 20 }
                },
                height: { fullHeight: false, value: "100%" },
                background: {
                    image: {
                        src: "http://localhost:9000/files/bg-1_3l9jq6iolsj.svg",
                        scaling: "contain",
                        position: "center"
                    }
                },
                verticalAlign: "center",
                width: { value: "1000px" },
                horizontalAlignFlex: "center"
            }
        },
        elements: [
            {
                data: {
                    settings: {
                        margin: { advanced: false, desktop: { all: 100 }, mobile: { all: 15 } },
                        padding: { desktop: { all: 0 }, mobile: { all: 15 } },
                        background: { image: { src: null, scaling: "cover" } },
                        width: { value: "500px" },
                        horizontalAlign: "left"
                    }
                },
                elements: [
                    {
                        data: {
                            width: 100,
                            settings: {
                                animation: { name: "fade-up" },
                                margin: { desktop: { all: 20 }, mobile: { all: 10 } },
                                padding: { desktop: { all: 50 }, mobile: { all: 15 } },
                                shadow: {
                                    color: "var(--webiny-cms-theme-background)",
                                    vertical: "2",
                                    horizontal: "0",
                                    blur: "2"
                                },
                                background: { color: "var(--webiny-cms-theme-surface)" },
                                border: {
                                    color: "var(--webiny-cms-theme-background)",
                                    width: 1,
                                    radius: 2,
                                    style: "solid"
                                }
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
                                                    type: "h4",
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
                                    settings: {
                                        padding: { desktop: { all: 20 }, mobile: { all: 20 } }
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
                                                    type: "description",
                                                    data: { align: "center" },
                                                    nodes: [
                                                        {
                                                            object: "text",
                                                            leaves: [
                                                                {
                                                                    object: "leaf",
                                                                    text:
                                                                        "Duis magna minim mollit dolore id magna excepteur sint id eiusmod aliqua laboris ullamco aute. Amet minim amet tempor proident laborum aliquip sit in.",
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
                                        padding: { desktop: { all: 20 }, mobile: { all: 20 } },
                                        margin: {
                                            advanced: true,
                                            desktop: { top: 20, bottom: 20 },
                                            mobile: { top: 15, bottom: 15 }
                                        }
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
                                            nodes: [
                                                {
                                                    object: "block",
                                                    type: "button",
                                                    nodes: [
                                                        {
                                                            object: "text",
                                                            leaves: [
                                                                { object: "leaf", text: "Click me" }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    },
                                    type: "secondary",
                                    icon: {
                                        id: ["fas", "download"],
                                        svg:
                                            '<svg width="12" viewBox="0 0 512 512"><path d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z" fill="currentColor"></path></svg>',
                                        width: "12",
                                        position: "top"
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
        name: "cms-element-5c27a674a0b03cc97f75b0e4_13sujq9pfxjg.png",
        size: 63722,
        src: "http://localhost:9000/files/cms-element-5c27a674a0b03cc97f75b0e4_13sujq9pfxjg.png",
        type: "image/png",
        width: 1000,
        height: 432
    },
    category: "cms-block-category-cta"
};
