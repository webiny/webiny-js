import { SerializedEditorState } from "lexical";

// `any` is passed as a generic type because lexical is complaining about its own data structure. ¯\_(ツ)_/¯
export const stateMock: SerializedEditorState<any> = {
    root: {
        children: [
            {
                children: [
                    {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Test CMS Title",
                        type: "text",
                        version: 1
                    }
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "heading-element",
                version: 1,
                tag: "h1",
                styles: [
                    {
                        styleId: "heading1",
                        type: "typography"
                    }
                ]
            },
            {
                children: [],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph-element",
                version: 1,
                styles: [
                    {
                        styleId: "paragraph1",
                        type: "typography"
                    }
                ]
            },
            {
                children: [
                    {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Testing a ",
                        type: "text",
                        version: 1
                    },
                    {
                        children: [
                            {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "link",
                                type: "text",
                                version: 1
                            }
                        ],
                        direction: "ltr",
                        format: "",
                        indent: 0,
                        type: "link",
                        version: 1,
                        rel: "noreferrer",
                        target: null,
                        title: null,
                        url: "https://space.com"
                    },
                    {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: " for parsing",
                        type: "text",
                        version: 1
                    }
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph-element",
                version: 1,
                styles: [
                    {
                        styleId: "paragraph1",
                        type: "typography"
                    }
                ]
            },
            {
                children: [
                    {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Test CMS Paragraph",
                        type: "text",
                        version: 1
                    }
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph-element",
                version: 1,
                styles: [
                    {
                        styleId: "paragraph1",
                        type: "typography"
                    }
                ]
            },
            {
                children: [],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph-element",
                version: 1,
                styles: [
                    {
                        styleId: "paragraph1",
                        type: "typography"
                    }
                ]
            },
            {
                children: [
                    {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Test quote from lexical ",
                        type: "text",
                        version: 1
                    },
                    {
                        detail: 0,
                        format: 1,
                        mode: "normal",
                        style: "",
                        text: "CMS",
                        type: "text",
                        version: 1
                    }
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "webiny-quote",
                version: 1,
                styles: [
                    {
                        styleId: "quote",
                        type: "typography"
                    }
                ],
                styleId: "quote"
            },
            {
                children: [],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph-element",
                version: 1,
                styles: [
                    {
                        styleId: "paragraph1",
                        type: "typography"
                    }
                ]
            },
            {
                children: [
                    {
                        children: [
                            {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "List item 1",
                                type: "text",
                                version: 1
                            }
                        ],
                        direction: "ltr",
                        format: "",
                        indent: 0,
                        type: "webiny-listitem",
                        version: 1,
                        value: 1
                    },
                    {
                        children: [
                            {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "List item 2",
                                type: "text",
                                version: 1
                            }
                        ],
                        direction: "ltr",
                        format: "",
                        indent: 0,
                        type: "webiny-listitem",
                        version: 1,
                        value: 2
                    },
                    {
                        children: [
                            {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "List item 3",
                                type: "text",
                                version: 1
                            }
                        ],
                        direction: "ltr",
                        format: "",
                        indent: 0,
                        type: "webiny-listitem",
                        version: 1,
                        value: 3
                    }
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "webiny-list",
                version: 1,
                themeStyleId: "list",
                listType: "bullet",
                start: 1,
                tag: "ul"
            },
            {
                children: [],
                direction: null,
                format: "",
                indent: 0,
                type: "paragraph-element",
                version: 1,
                styles: [
                    {
                        styleId: "paragraph1",
                        type: "typography"
                    }
                ]
            }
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1
    }
};
