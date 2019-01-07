export default {
    id: "5c27aa6da0b03ccad1fc57c2",
    name: "Call to action #8",
    type: "block",
    content: {
        data: {
            settings: {
                background: {
                    image: {
                        src: "http://localhost:9000/files/bg1_o7xjq8cvx9o.svg",
                        position: "center"
                    }
                },
                margin: { advanced: true, desktop: { top: 100, bottom: 100 } },
                width: { value: "1000px" },
                padding: { mobile: { all: 25, top: 25, right: 25, bottom: 25, left: 25 } },
                height: { fullHeight: true, value: "100%" },
                verticalAlign: "center"
            }
        },
        elements: [
            {
                data: {
                    settings: {
                        margin: { desktop: { all: 15 }, mobile: { all: 15 } },
                        padding: { desktop: { all: 15 }, mobile: { all: 15 } }
                    }
                },
                elements: [
                    {
                        data: {
                            width: 100,
                            settings: {
                                animation: { name: "fade-up" },
                                margin: { desktop: { all: 20 }, mobile: { all: 20 } }
                            }
                        },
                        elements: [
                            {
                                data: {
                                    icon: {
                                        id: ["fas", "birthday-cake"],
                                        svg:
                                            '<svg width="50" viewBox="0 0 448 512" color="var(--webiny-cms-theme-surface)"><path d="M448 384c-28.02 0-31.26-32-74.5-32-43.43 0-46.825 32-74.75 32-27.695 0-31.454-32-74.75-32-42.842 0-47.218 32-74.5 32-28.148 0-31.202-32-74.75-32-43.547 0-46.653 32-74.75 32v-80c0-26.5 21.5-48 48-48h16V112h64v144h64V112h64v144h64V112h64v144h16c26.5 0 48 21.5 48 48v80zm0 128H0v-96c43.356 0 46.767-32 74.75-32 27.951 0 31.253 32 74.75 32 42.843 0 47.217-32 74.5-32 28.148 0 31.201 32 74.75 32 43.357 0 46.767-32 74.75-32 27.488 0 31.252 32 74.5 32v96zM96 96c-17.75 0-32-14.25-32-32 0-31 32-23 32-64 12 0 32 29.5 32 56s-14.25 40-32 40zm128 0c-17.75 0-32-14.25-32-32 0-31 32-23 32-64 12 0 32 29.5 32 56s-14.25 40-32 40zm128 0c-17.75 0-32-14.25-32-32 0-31 32-23 32-64 12 0 32 29.5 32 56s-14.25 40-32 40z" fill="currentColor"></path></svg>',
                                        color: "var(--webiny-cms-theme-surface)",
                                        width: "50"
                                    }
                                },
                                elements: [],
                                type: "cms-element-icon"
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
                                                    type: "h3White",
                                                    data: { align: "center" },
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
                                        padding: { desktop: { all: 20 }, mobile: { all: 20 } },
                                        margin: { desktop: { all: 25 }, mobile: { all: 15 } }
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
                                                    type: "paragraphWhite",
                                                    data: { align: "center" },
                                                    nodes: [
                                                        {
                                                            object: "text",
                                                            leaves: [
                                                                {
                                                                    object: "leaf",
                                                                    text:
                                                                        "Nisi duis pariatur qui exercitation incididunt irure pariatur cillum sint duis enim. ",
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
                                        padding: { mobile: { all: 20 } },
                                        margin: {
                                            advanced: true,
                                            desktop: { right: 250, left: 250, bottom: 25 },
                                            mobile: { top: 15, right: 15, bottom: 15, left: 15 }
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
                                    settings: { horizontalAlignFlex: "center" }
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
        name: "cms-element-5c27aa6da0b03ccad1fc57c2_1428jq9q1qjn.png",
        size: 219727,
        src: "http://localhost:9000/files/cms-element-5c27aa6da0b03ccad1fc57c2_1428jq9q1qjn.png",
        type: "image/png",
        width: 1000,
        height: 597
    },
    category: "cms-block-category-cta"
};
