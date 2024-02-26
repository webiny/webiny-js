export const createRichTextValue = (): Record<string, any> => {
    return {
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: "normal",
                            style: "",
                            text: "A rich text field value.",
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
                            text: "We will add some titles and paragraphs and lists.",
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
                },
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: "normal",
                            style: "",
                            text: "A title",
                            type: "text",
                            version: 1
                        }
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    type: "heading-element",
                    version: 1,
                    tag: "h2",
                    styles: [
                        {
                            styleId: "heading2",
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
                                    text: "A list",
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
                                    text: "B list",
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
                                    text: "C list",
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
                }
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    };
};
