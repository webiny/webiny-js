/**
 * @jest-environment jsdom
 */
import { LexicalNode } from "lexical";
import { $isHeadingNode } from "@webiny/lexical-nodes";
import { createMocks } from "./mocks/htmlMocks";
import { createHtmlToLexicalParser } from "~/index";
import { toBrowserDom, toJsDom } from "./utils/toDom";

const defaultParser = createHtmlToLexicalParser();

describe("HTML to Lexical State Parser", () => {
    // We're testing 2 parsers: JSDOM and DOMParser, as this package should work in both Node and Browser environments.
    const jsDomMocks = createMocks(toJsDom);
    const domParserMocks = createMocks(toBrowserDom);

    [jsDomMocks, domParserMocks].forEach(mocks => {
        describe(`Test parsing with "${mocks.domParser}"`, () => {
            it("should parse html to paragraph node", async () => {
                expect(defaultParser(mocks.paragraphHtmlTag)).toMatchObject({
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

            it("should normalize the text node - wrap the node in paragraph element", () => {
                /**
                 * By default, parser will normalize the nodes and convert DOM nodes to supported lexical nodes.
                 * It's expected all unsupported html tags like div, figure, button and other to be removed and not converted.
                 */
                expect(defaultParser(mocks.htmlWithUnsupportedHtmlTags)).toMatchObject({
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
                expect(defaultParser(mocks.boldItalicUnderlineFormatHtml)).toMatchObject({
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
                expect(defaultParser(mocks.headingH1Html)).toMatchObject({
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
                expect(defaultParser(mocks.headingH4Html)).toMatchObject({
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
                expect(defaultParser(mocks.bulletListHtml)).toMatchObject({
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
                expect(defaultParser(mocks.numberedListHtml)).toMatchObject({
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
                expect(defaultParser(mocks.linkHtml)).toMatchObject({
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
                                        type: "link",
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
                expect(defaultParser(mocks.imageHtml)).toMatchObject({
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
                expect(defaultParser(mocks.quoteHtml)).toMatchObject({
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
                expect(defaultParser(mocks.codeHtml)).toMatchObject({
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

            it("should turn off node text normalization", async () => {
                const parser = createHtmlToLexicalParser({ normalizeTextNodes: false });
                const messages = [
                    "rootNode.append: Only element or decorator nodes can be appended to the root node",
                    "Minified Lexical error #56"
                ];

                expect(() => parser(mocks.htmlWithUnsupportedHtmlTags)).toThrow(
                    process.env.NODE_ENV === "development" ? messages[0] : messages[1]
                );
            });

            it("should be able to add custom node mapper", async () => {
                const addCustomThemeStyleToHeadings = (node: LexicalNode): LexicalNode => {
                    if ($isHeadingNode(node)) {
                        return node.setThemeStyles([
                            { styleId: "my-default-id", type: "typography" }
                        ]);
                    }
                    return node;
                };

                const parser = createHtmlToLexicalParser({
                    nodeMapper: addCustomThemeStyleToHeadings
                });
                expect(parser(mocks.headingH1Html)).toMatchObject({
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
                                // modified by node mapper
                                styles: [{ styleId: "my-default-id", type: "typography" }]
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
    });
});
