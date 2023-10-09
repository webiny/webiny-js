/**
 * @jest-environment jsdom
 */

import {
    boldItalicUnderlineFormatHtml,
    bulletListHtml,
    codeHtml,
    headingH1Html,
    headingH4Html,
    htmlWithNotSupportedHtmlTags,
    imageHtml,
    linkHtml,
    numberedListHtml,
    paragraphHtmlTag,
    quoteHtml
} from "./test-data";
import { createHtmlToLexicalParser } from "../src/index";

const parser = createHtmlToLexicalParser();

describe("Test how parser convert the html tags into webiny's lexical node objects", () => {
    it("should parse html to paragraph node", async () => {
        expect(parser(paragraphHtmlTag)).toMatchObject({
            root: {
                children: [
                    {
                        children: [
                            {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: "Testing paragraph element",
                                type: "text",
                                version: 1
                            }
                        ],
                        direction: null,
                        format: "",
                        indent: 0,
                        styles: [],
                        type: "paragraph-element",
                        version: 1
                    }
                ],
                direction: null,
                format: "",
                indent: 0,
                type: "root",
                version: 1
            }
        });
    });
});
it("should normalize the text node - wrap the node in paragraph element", () => {
    /**
     * By default, parser will normalize the nodes and convert DOM nodes to supported lexical nodes.
     * It's expected all unsupported html tags like div, figure, button and other to be removed and not converted.
     */
    expect(parser(htmlWithNotSupportedHtmlTags)).toMatchObject({
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: "normal",
                            style: "",
                            text: "See all 37 photos",
                            type: "text",
                            version: 1
                        }
                    ],
                    direction: null,
                    format: "",
                    indent: 0,
                    styles: [],
                    type: "paragraph-element",
                    version: 1
                }
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    });
});

it("should generate paragraph element with text node with bold, italic and underline formats", () => {
    expect(parser(boldItalicUnderlineFormatHtml)).toMatchObject({
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 11, // all formats
                            mode: "normal",
                            style: "",
                            text: "formatted text",
                            type: "text",
                            version: 1
                        }
                    ],
                    direction: null,
                    format: "",
                    indent: 0,
                    type: "paragraph-element",
                    version: 1,
                    styles: []
                }
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    });
});

it("should generate heading nodes", () => {
    /**
     * Test HTML h1 tag
     */
    expect(parser(headingH1Html)).toMatchObject({
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: "normal",
                            style: "",
                            text: "Testing heading h1 element",
                            type: "text",
                            version: 1
                        }
                    ],
                    direction: null,
                    format: "",
                    indent: 0,
                    tag: "h1",
                    type: "heading-element",
                    version: 1,
                    styles: []
                }
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    });

    /**
     * Test HTML h4 tag
     */
    expect(parser(headingH4Html)).toMatchObject({
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: "normal",
                            style: "",
                            text: "Testing heading h4 element",
                            type: "text",
                            version: 1
                        }
                    ],
                    direction: null,
                    format: "",
                    indent: 0,
                    tag: "h4",
                    type: "heading-element",
                    version: 1,
                    styles: []
                }
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    });
});

it("should generate bullet list, and nested list item nodes", () => {
    expect(parser(bulletListHtml)).toMatchObject({
        root: {
            children: [
                {
                    children: [
                        {
                            checked: undefined,
                            children: [
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: "normal",
                                    style: "",
                                    text: "list item 1",
                                    type: "text",
                                    version: 1
                                }
                            ],
                            direction: null,
                            format: "",
                            indent: 0,
                            type: "webiny-listitem",
                            version: 1,
                            value: 1
                        },
                        {
                            checked: undefined,
                            children: [
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: "normal",
                                    style: "",
                                    text: "list item 2",
                                    type: "text",
                                    version: 1
                                }
                            ],
                            direction: null,
                            format: "",
                            indent: 0,
                            type: "webiny-listitem",
                            version: 1,
                            value: 1
                        }
                    ],
                    direction: null,
                    format: "",
                    indent: 0,
                    type: "webiny-list",
                    version: 1,
                    listType: "bullet",
                    start: 1,
                    tag: "ul",
                    themeStyleId: ""
                }
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    });
});

it("should generate numbered list, and nested list item nodes", () => {
    expect(parser(numberedListHtml)).toMatchObject({
        root: {
            children: [
                {
                    children: [
                        {
                            checked: undefined,
                            children: [
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: "normal",
                                    style: "",
                                    text: "list item 1",
                                    type: "text",
                                    version: 1
                                }
                            ],
                            direction: null,
                            format: "",
                            indent: 0,
                            type: "webiny-listitem",
                            version: 1,
                            value: 1
                        },
                        {
                            checked: undefined,
                            children: [
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: "normal",
                                    style: "",
                                    text: "list item 2",
                                    type: "text",
                                    version: 1
                                }
                            ],
                            direction: null,
                            format: "",
                            indent: 0,
                            type: "webiny-listitem",
                            version: 1,
                            value: 1
                        }
                    ],
                    direction: null,
                    format: "",
                    indent: 0,
                    type: "webiny-list",
                    version: 1,
                    listType: "number",
                    start: 1,
                    tag: "ol",
                    themeStyleId: ""
                }
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    });
});

it("should not generate paragraph and link node", () => {
    expect(parser(linkHtml)).toMatchObject({
        root: {
            children: [
                {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: "normal",
                                    style: "",
                                    text: "My webiny link",
                                    type: "text",
                                    version: 1
                                }
                            ],
                            direction: null,
                            format: "",
                            indent: 0,
                            type: "link-node",
                            version: 1,
                            rel: "noopener noreferrer",
                            target: "_blank",
                            title: null,
                            url: "https://webiny.com"
                        }
                    ],
                    direction: null,
                    format: "",
                    indent: 0,
                    type: "paragraph-element",
                    version: 1,
                    styles: []
                }
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    });
});

it("should not generate image node", () => {
    expect(parser(imageHtml)).toMatchObject({
        root: {
            children: [],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    });
});

it("should generate quote node", () => {
    expect(parser(quoteHtml)).toMatchObject({
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: "normal",
                            style: "",
                            text: "My quote block",
                            type: "text",
                            version: 1
                        }
                    ],
                    direction: null,
                    format: "",
                    indent: 0,
                    type: "webiny-quote",
                    version: 1,
                    styles: [],
                    styleId: undefined
                }
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    });
});

it("should generate code node", () => {
    expect(parser(codeHtml)).toMatchObject({
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 16, // lexical number for code format
                            mode: "normal",
                            style: "",
                            text: "Text code formatting",
                            type: "text",
                            version: 1
                        }
                    ],
                    direction: null,
                    format: "",
                    indent: 0,
                    type: "paragraph-element",
                    version: 1,
                    styles: []
                }
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1
        }
    });
});
