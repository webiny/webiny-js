import { describe, expect, it, test } from "vitest";
import { LexicalNode } from "lexical";
import { $isHeadingNode, $isListNode, $isParagraphNode, $isQuoteNode } from "@webiny/lexical-nodes";
import { stateMock } from "./mocks/stateMocks";
import { createLexicalStateTransformer } from "~/createLexicalStateTransformer";

describe("Lexical State Transformer", () => {
    it("should flatten lexical editor state to an array of objects with HTML", () => {
        const transformer = createLexicalStateTransformer();

        const output = transformer.flatten(stateMock);

        expect(output).toEqual([
            {
                node: {
                    __className: undefined,
                    __type: "wby-heading",
                    __parent: "root",
                    __prev: null,
                    __next: "3",
                    __key: "1",
                    __first: "2",
                    __last: "2",
                    __size: 1,
                    __slotHost: null,
                    __slots: null,
                    __format: 0,
                    __style: "",
                    __indent: 0,
                    __dir: "ltr",
                    __textFormat: 0,
                    __textStyle: "",
                    __tag: "h1",
                    __styleId: "heading1"
                },
                html: '<h1 dir="ltr"><span style="white-space: pre-wrap;">Test CMS Title</span></h1>'
            },
            {
                node: {
                    __className: undefined,
                    __type: "wby-paragraph",
                    __parent: "root",
                    __prev: "1",
                    __next: "4",
                    __key: "3",
                    __first: null,
                    __last: null,
                    __size: 0,
                    __slotHost: null,
                    __slots: null,
                    __format: 0,
                    __style: "",
                    __indent: 0,
                    __dir: "ltr",
                    __textFormat: 0,
                    __textStyle: "",
                    __styleId: "paragraph1"
                },
                html: '<p dir="ltr"><br></p>'
            },
            {
                node: {
                    __className: undefined,
                    __type: "wby-paragraph",
                    __parent: "root",
                    __prev: "3",
                    __next: "9",
                    __key: "4",
                    __first: "5",
                    __last: "8",
                    __size: 3,
                    __slotHost: null,
                    __slots: null,
                    __format: 0,
                    __style: "",
                    __indent: 0,
                    __dir: "ltr",
                    __textFormat: 0,
                    __textStyle: "",
                    __styleId: "paragraph1"
                },
                html: '<p dir="ltr"><span style="white-space: pre-wrap;">Testing a </span><a href="https://space.com" rel="noreferrer" dir="ltr"><span style="white-space: pre-wrap;">link</span></a><span style="white-space: pre-wrap;"> for parsing</span></p>'
            },
            {
                node: {
                    __className: undefined,
                    __type: "wby-paragraph",
                    __parent: "root",
                    __prev: "4",
                    __next: "11",
                    __key: "9",
                    __first: "10",
                    __last: "10",
                    __size: 1,
                    __slotHost: null,
                    __slots: null,
                    __format: 0,
                    __style: "",
                    __indent: 0,
                    __dir: "ltr",
                    __textFormat: 0,
                    __textStyle: "",
                    __styleId: "paragraph1"
                },
                html: '<p dir="ltr"><span style="white-space: pre-wrap;">Test CMS Paragraph</span></p>'
            },
            {
                node: {
                    __className: undefined,
                    __type: "wby-paragraph",
                    __parent: "root",
                    __prev: "9",
                    __next: "12",
                    __key: "11",
                    __first: null,
                    __last: null,
                    __size: 0,
                    __slotHost: null,
                    __slots: null,
                    __format: 0,
                    __style: "",
                    __indent: 0,
                    __dir: "ltr",
                    __textFormat: 0,
                    __textStyle: "",
                    __styleId: "paragraph1"
                },
                html: '<p dir="ltr"><br></p>'
            },
            {
                node: {
                    __className: undefined,
                    __type: "wby-quote",
                    __parent: "root",
                    __prev: "11",
                    __next: "15",
                    __key: "12",
                    __first: "13",
                    __last: "14",
                    __size: 2,
                    __slotHost: null,
                    __slots: null,
                    __format: 0,
                    __style: "",
                    __indent: 0,
                    __dir: "ltr",
                    __textFormat: 0,
                    __textStyle: "",
                    __styleId: "quote"
                },
                html: '<blockquote dir="ltr"><span style="white-space: pre-wrap;">Test quote from lexical </span><strong style="white-space: pre-wrap;">CMS</strong></blockquote>'
            },
            {
                node: {
                    __className: undefined,
                    __type: "wby-paragraph",
                    __parent: "root",
                    __prev: "12",
                    __next: "16",
                    __key: "15",
                    __first: null,
                    __last: null,
                    __size: 0,
                    __slotHost: null,
                    __slots: null,
                    __format: 0,
                    __style: "",
                    __indent: 0,
                    __dir: "ltr",
                    __textFormat: 0,
                    __textStyle: "",
                    __styleId: "paragraph1"
                },
                html: '<p dir="ltr"><br></p>'
            },
            {
                node: {
                    __className: undefined,
                    __type: "wby-list",
                    __parent: "root",
                    __prev: "15",
                    __next: "23",
                    __key: "16",
                    __first: "17",
                    __last: "21",
                    __size: 3,
                    __slotHost: null,
                    __slots: null,
                    __format: 0,
                    __style: "",
                    __indent: 0,
                    __dir: "ltr",
                    __textFormat: 0,
                    __textStyle: "",
                    __styleId: "",
                    __listType: "bullet",
                    __tag: "ul",
                    __start: 1
                },
                html: '<ul dir="ltr"><li value="1" dir="ltr"><span style="white-space: pre-wrap;">List item 1</span></li><li value="2" dir="ltr"><span style="white-space: pre-wrap;">List item 2</span></li><li value="3" dir="ltr"><span style="white-space: pre-wrap;">List item 3</span></li></ul>'
            },
            {
                node: {
                    __className: undefined,
                    __type: "wby-paragraph",
                    __parent: "root",
                    __prev: "16",
                    __next: null,
                    __key: "23",
                    __first: null,
                    __last: null,
                    __size: 0,
                    __slotHost: null,
                    __slots: null,
                    __format: 0,
                    __style: "",
                    __indent: 0,
                    __dir: null,
                    __textFormat: 0,
                    __textStyle: "",
                    __styleId: "paragraph1"
                },
                html: "<p><br></p>"
            }
        ]);
    });

    test("example of flat state post-processing", () => {
        const transformer = createLexicalStateTransformer();

        const nodeToType = (node: LexicalNode) => {
            switch (true) {
                case $isHeadingNode(node):
                    return "heading";
                case $isParagraphNode(node):
                    return "paragraph";
                case $isQuoteNode(node):
                    return "quote";
                case $isListNode(node):
                    return "list";
                default:
                    return "unknown";
            }
        };

        const output = transformer.flatten(stateMock).map((item, index) => {
            return {
                order: index + 1,
                text: item.html,
                type: nodeToType(item.node)
            };
        });

        expect(output).toEqual([
            {
                order: 1,
                text: '<h1 dir="ltr"><span style="white-space: pre-wrap;">Test CMS Title</span></h1>',
                type: "heading"
            },
            {
                order: 2,
                text: '<p dir="ltr"><br></p>',
                type: "paragraph"
            },
            {
                order: 3,
                text: '<p dir="ltr"><span style="white-space: pre-wrap;">Testing a </span><a href="https://space.com" rel="noreferrer" dir="ltr"><span style="white-space: pre-wrap;">link</span></a><span style="white-space: pre-wrap;"> for parsing</span></p>',
                type: "paragraph"
            },
            {
                order: 4,
                text: '<p dir="ltr"><span style="white-space: pre-wrap;">Test CMS Paragraph</span></p>',
                type: "paragraph"
            },
            {
                order: 5,
                text: '<p dir="ltr"><br></p>',
                type: "paragraph"
            },
            {
                order: 6,
                text: '<blockquote dir="ltr"><span style="white-space: pre-wrap;">Test quote from lexical </span><strong style="white-space: pre-wrap;">CMS</strong></blockquote>',
                type: "quote"
            },
            {
                order: 7,
                text: '<p dir="ltr"><br></p>',
                type: "paragraph"
            },
            {
                order: 8,
                text: '<ul dir="ltr"><li value="1" dir="ltr"><span style="white-space: pre-wrap;">List item 1</span></li><li value="2" dir="ltr"><span style="white-space: pre-wrap;">List item 2</span></li><li value="3" dir="ltr"><span style="white-space: pre-wrap;">List item 3</span></li></ul>',
                type: "list"
            },
            {
                order: 9,
                text: "<p><br></p>",
                type: "paragraph"
            }
        ]);
    });

    it("should convert lexical state to HTML", () => {
        const transformer = createLexicalStateTransformer();

        const output = transformer.toHtml(stateMock);

        expect(output).toEqual(
            `<h1 dir="ltr"><span style="white-space: pre-wrap;">Test CMS Title</span></h1><p dir="ltr"><br></p><p dir="ltr"><span style="white-space: pre-wrap;">Testing a </span><a href="https://space.com" rel="noreferrer" dir="ltr"><span style="white-space: pre-wrap;">link</span></a><span style="white-space: pre-wrap;"> for parsing</span></p><p dir="ltr"><span style="white-space: pre-wrap;">Test CMS Paragraph</span></p><p dir="ltr"><br></p><blockquote dir="ltr"><span style="white-space: pre-wrap;">Test quote from lexical </span><strong style="white-space: pre-wrap;">CMS</strong></blockquote><p dir="ltr"><br></p><ul dir="ltr"><li value="1" dir="ltr"><span style="white-space: pre-wrap;">List item 1</span></li><li value="2" dir="ltr"><span style="white-space: pre-wrap;">List item 2</span></li><li value="3" dir="ltr"><span style="white-space: pre-wrap;">List item 3</span></li></ul><p><br></p>`
        );
    });
});
