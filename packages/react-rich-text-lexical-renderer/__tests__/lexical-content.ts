// Simulate the paragraph component with default content like in Page builder
export const defaultParagraphValue = JSON.stringify({
    root: {
        children: [
            {
                children: [
                    {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.",
                        type: "text",
                        version: 1
                    }
                ],
                direction: "ltr",
                styles: [],
                format: "",
                indent: 0,
                tag: "p",
                type: "paragraph-element",
                version: 1
            }
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1
    }
});

export const expectedParagraphRenderedValue =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.";

// Simulate the header component with default content like in Page builder
export const defaultHeadingValue = {
    root: {
        children: [
            {
                children: [
                    {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Heading",
                        type: "text",
                        version: 1
                    }
                ],
                direction: "ltr",
                styles: [],
                format: "",
                indent: 0,
                type: "heading-element",
                version: 1,
                tag: "h1"
            }
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1
    }
};

export const expectedHeadingRenderedValue = "Heading";

// Simulate the header component with default content like in Page builder
export const notCorrectValue = "some default text that is not correct value for lexical";

export const LexicalJsonCmsDataInput = JSON.parse(`{
    "root": {
        "children": [
            {
                "children": [
                    {
                        "detail": 0,
                        "format": 0,
                        "mode": "normal",
                        "style": "",
                        "text": "Test CMS Title",
                        "type": "text",
                        "version": 1
                    }
                ],
                "direction": "ltr",
                "format": "",
                "indent": 0,
                "type": "heading-element",
                "version": 1,
                "tag": "h1",
                "styles": [
                    {
                        "styleId": "heading1",
                        "type": "typography"
                    }
                ]
            },
            {
                "children": [],
                "direction": "ltr",
                "format": "",
                "indent": 0,
                "type": "paragraph-element",
                "version": 1,
                "styles": [
                    {
                        "styleId": "paragraph1",
                        "type": "typography"
                    }
                ]
            },
            {
                "children": [
                    {
                        "detail": 0,
                        "format": 0,
                        "mode": "normal",
                        "style": "",
                        "text": "Test CMS Paragraph",
                        "type": "text",
                        "version": 1
                    }
                ],
                "direction": "ltr",
                "format": "",
                "indent": 0,
                "type": "paragraph-element",
                "version": 1,
                "styles": [
                    {
                        "styleId": "paragraph1",
                        "type": "typography"
                    }
                ]
            },
            {
                "children": [],
                "direction": "ltr",
                "format": "",
                "indent": 0,
                "type": "paragraph-element",
                "version": 1,
                "styles": [
                    {
                        "styleId": "paragraph1",
                        "type": "typography"
                    }
                ]
            },
            {
                "children": [
                    {
                        "detail": 0,
                        "format": 0,
                        "mode": "normal",
                        "style": "",
                        "text": "Test quote from lexical ",
                        "type": "text",
                        "version": 1
                    },
                    {
                        "detail": 0,
                        "format": 1,
                        "mode": "normal",
                        "style": "",
                        "text": "CMS",
                        "type": "text",
                        "version": 1
                    }
                ],
                "direction": "ltr",
                "format": "",
                "indent": 0,
                "type": "webiny-quote",
                "version": 1,
                "styles": [
                    {
                        "styleId": "quote",
                        "type": "typography"
                    }
                ],
                "styleId": "quote"
            },
            {
                "children": [],
                "direction": "ltr",
                "format": "",
                "indent": 0,
                "type": "paragraph-element",
                "version": 1,
                "styles": [
                    {
                        "styleId": "paragraph1",
                        "type": "typography"
                    }
                ]
            },
            {
                "children": [
                    {
                        "children": [
                            {
                                "detail": 0,
                                "format": 0,
                                "mode": "normal",
                                "style": "",
                                "text": "List item 1",
                                "type": "text",
                                "version": 1
                            }
                        ],
                        "direction": "ltr",
                        "format": "",
                        "indent": 0,
                        "type": "webiny-listitem",
                        "version": 1,
                        "value": 1
                    },
                    {
                        "children": [
                            {
                                "detail": 0,
                                "format": 0,
                                "mode": "normal",
                                "style": "",
                                "text": "List item 2",
                                "type": "text",
                                "version": 1
                            }
                        ],
                        "direction": "ltr",
                        "format": "",
                        "indent": 0,
                        "type": "webiny-listitem",
                        "version": 1,
                        "value": 2
                    },
                    {
                        "children": [
                            {
                                "detail": 0,
                                "format": 0,
                                "mode": "normal",
                                "style": "",
                                "text": "List item 3",
                                "type": "text",
                                "version": 1
                            }
                        ],
                        "direction": "ltr",
                        "format": "",
                        "indent": 0,
                        "type": "webiny-listitem",
                        "version": 1,
                        "value": 3
                    }
                ],
                "direction": "ltr",
                "format": "",
                "indent": 0,
                "type": "webiny-list",
                "version": 1,
                "themeStyleId": "list",
                "listType": "bullet",
                "start": 1,
                "tag": "ul"
            },
            {
                "children": [],
                "direction": null,
                "format": "",
                "indent": 0,
                "type": "paragraph-element",
                "version": 1,
                "styles": [
                    {
                        "styleId": "paragraph1",
                        "type": "typography"
                    }
                ]
            },
            {
                "children": [],
                "direction": "ltr",
                "format": "",
                "indent": 0,
                "type": "paragraph-element",
                "version": 1,
                "styles": [
                    {
                        "styleId": "paragraph1",
                        "type": "typography"
                    }
                ]
            }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "root",
        "version": 1
    }
}`);
