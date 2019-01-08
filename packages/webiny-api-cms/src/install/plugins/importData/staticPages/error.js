// @flow
export default {
    title: "Error Page",
    url: "/error",
    content: {
        id: "P3NNeXWAk",
        data: {},
        settings: {},
        elements: [
            {
                id: "STaGA7c5Jt",
                data: {},
                settings: {},
                elements: [
                    {
                        id: "E0j-dyOuLN",
                        data: {},
                        settings: { style: { margin: { all: 15 }, padding: { all: 15 } } },
                        elements: [
                            {
                                id: "iwpwZYraMw",
                                data: { width: 100 },
                                settings: { style: { margin: { all: 20 } } },
                                elements: [
                                    {
                                        id: "zACl76J1b",
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
                                                                                "Woops, something went wrong! :(",
                                                                            marks: []
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        settings: { style: { padding: { all: 20 } } },
                                        elements: [],
                                        path: "0.0.0.0.0",
                                        type: "cms-element-text"
                                    }
                                ],
                                path: "0.0.0.0",
                                type: "cms-element-column"
                            }
                        ],
                        path: "0.0.0",
                        type: "cms-element-row"
                    }
                ],
                path: "0.0",
                type: "cms-element-block"
            }
        ],
        path: "0",
        type: "cms-element-document"
    },
    settings: {
        general: { layout: "static" }
    }
};
