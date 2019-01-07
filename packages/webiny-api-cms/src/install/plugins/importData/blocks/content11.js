export default {
    id: "5c2a1f70a0b03c6a2d3bc73c",
    name: "Content #11",
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
                        src: "http://localhost:9000/files/bg-3_kqzjqcdp19p.svg",
                        scaling: "originalSize",
                        position: "center"
                    }
                },
                verticalAlign: "center",
                width: { value: "1000px" },
                horizontalAlignFlex: "flex-start",
                margin: {
                    advanced: true,
                    desktop: { top: 50, bottom: 25, left: 50 },
                    mobile: { top: 15, right: 15, bottom: 15, left: 15 }
                }
            }
        },
        elements: [
            {
                data: {
                    settings: {
                        margin: {
                            desktop: { right: 100, all: 100, top: 100, bottom: 100, left: 100 }
                        },
                        padding: { desktop: { all: 0 } },
                        background: { image: { src: null, scaling: "cover" } },
                        width: { value: "400px" },
                        horizontalAlign: "left"
                    }
                },
                elements: [
                    {
                        data: {
                            width: 100,
                            settings: {
                                animation: { name: "fade-left" },
                                margin: { mobile: { all: 10 } },
                                shadow: {
                                    color: "var(--webiny-cms-theme-background)",
                                    vertical: "2",
                                    horizontal: "0",
                                    blur: "2"
                                },
                                background: { color: "var(--webiny-cms-theme-surface)" },
                                padding: { desktop: { all: 50 }, mobile: { all: 15 } },
                                border: {
                                    color: "var(--webiny-cms-theme-primary)",
                                    width: 5,
                                    radius: 5,
                                    style: "solid",
                                    borders: { right: false, bottom: false, left: false }
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
                                                    data: { align: "justify" },
                                                    nodes: [
                                                        {
                                                            object: "text",
                                                            leaves: [
                                                                {
                                                                    object: "leaf",
                                                                    text: "Webiny CMS",
                                                                    marks: [
                                                                        {
                                                                            object: "mark",
                                                                            type: "bold",
                                                                            data: {}
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    },
                                    settings: {
                                        margin: { desktop: { all: 0 }, mobile: { all: 0 } },
                                        padding: { desktop: { all: 0 }, mobile: { all: 0 } }
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
                                                    data: { align: "justify" },
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
                                        padding: { desktop: { all: 0 }, mobile: { all: 0 } },
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
                                                                    text: "LEARN MORE",
                                                                    marks: []
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    },
                                    type: "simple",
                                    icon: {
                                        id: ["fas", "angle-right"],
                                        svg:
                                            '<svg width="12" viewBox="0 0 256 512"><path d="M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34z" fill="currentColor"></path></svg>',
                                        width: "12",
                                        position: "right"
                                    },
                                    settings: {
                                        horizontalAlignFlex: "flex-start",
                                        margin: { desktop: { all: 0 }, mobile: { all: 0 } },
                                        padding: { desktop: { all: 0 }, mobile: { all: 0 } }
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
        name: "cms-element-5c2a1f70a0b03c6a2d3bc73c_kyzjqcdx3bm.png",
        size: 48989,
        src: "http://localhost:9000/files/cms-element-5c2a1f70a0b03c6a2d3bc73c_kyzjqcdx3bm.png",
        type: "image/png",
        width: 1000,
        height: 485
    },
    category: "cms-block-category-content"
};
