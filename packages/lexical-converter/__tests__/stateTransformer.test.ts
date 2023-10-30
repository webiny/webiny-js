/**
 * @jest-environment jsdom
 */
import { LexicalNode } from "lexical";
import {
    $isHeadingNode,
    $isListNode,
    $isParagraphNode,
    $isQuoteNode,
    HeadingNode,
    ListNode,
    ParagraphNode,
    QuoteNode
} from "@webiny/lexical-nodes";
import { stateMock } from "./mocks/stateMocks";
import { createLexicalStateTransformer } from "~/createLexicalStateTransformer";

describe("Lexical State Transformer", () => {
    it("should flatten lexical editor state to an array of objects with HTML", () => {
        const transformer = createLexicalStateTransformer();

        const output = transformer.flatten(stateMock);

        expect(output).toEqual([
            {
                node: expect.any(HeadingNode),
                html: `<h1 dir="ltr"><span style=\"white-space: pre-wrap;\">Test CMS Title</span></h1>`
            },
            {
                node: expect.any(ParagraphNode),
                html: `<p dir="ltr"><br></p>`
            },
            {
                node: expect.any(ParagraphNode),
                html: `<p dir="ltr"><span style=\"white-space: pre-wrap;\">Testing a </span><a href="https://space.com" rel="noreferrer"><span style=\"white-space: pre-wrap;\">link</span></a><span style=\"white-space: pre-wrap;\"> for parsing</span></p>`
            },
            {
                node: expect.any(ParagraphNode),
                html: `<p dir="ltr"><span style=\"white-space: pre-wrap;\">Test CMS Paragraph</span></p>`
            },
            {
                node: expect.any(ParagraphNode),
                html: `<p dir="ltr"><br></p>`
            },
            {
                node: expect.any(QuoteNode),
                html: `<blockquote dir="ltr"><span style=\"white-space: pre-wrap;\">Test quote from lexical </span><b><strong style=\"white-space: pre-wrap;\">CMS</strong></b></blockquote>`
            },
            {
                node: expect.any(ParagraphNode),
                html: `<p dir="ltr"><br></p>`
            },
            {
                node: expect.any(ListNode),
                html: `<ul data-theme-list-style-id="list"><li value="1"><span style=\"white-space: pre-wrap;\">List item 1</span></li><li value="2"><span style=\"white-space: pre-wrap;\">List item 2</span></li><li value="3"><span style=\"white-space: pre-wrap;\">List item 3</span></li></ul>`
            },
            {
                node: expect.any(ParagraphNode),
                html: `<p><br></p>`
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
                text: `<h1 dir="ltr"><span style=\"white-space: pre-wrap;\">Test CMS Title</span></h1>`,
                type: "heading"
            },
            {
                order: 2,
                text: `<p dir="ltr"><br></p>`,
                type: "paragraph"
            },
            {
                order: 3,
                text: `<p dir="ltr"><span style=\"white-space: pre-wrap;\">Testing a </span><a href="https://space.com" rel="noreferrer"><span style=\"white-space: pre-wrap;\">link</span></a><span style=\"white-space: pre-wrap;\"> for parsing</span></p>`,
                type: "paragraph"
            },
            {
                order: 4,
                text: `<p dir="ltr"><span style=\"white-space: pre-wrap;\">Test CMS Paragraph</span></p>`,
                type: "paragraph"
            },
            {
                order: 5,
                text: `<p dir="ltr"><br></p>`,
                type: "paragraph"
            },
            {
                order: 6,
                text: `<blockquote dir="ltr"><span style=\"white-space: pre-wrap;\">Test quote from lexical </span><b><strong style=\"white-space: pre-wrap;\">CMS</strong></b></blockquote>`,
                type: "quote"
            },
            {
                order: 7,
                text: `<p dir="ltr"><br></p>`,
                type: "paragraph"
            },
            {
                order: 8,
                text: `<ul data-theme-list-style-id="list"><li value="1"><span style=\"white-space: pre-wrap;\">List item 1</span></li><li value="2"><span style=\"white-space: pre-wrap;\">List item 2</span></li><li value="3"><span style=\"white-space: pre-wrap;\">List item 3</span></li></ul>`,
                type: "list"
            },
            {
                order: 9,
                text: `<p><br></p>`,
                type: "paragraph"
            }
        ]);
    });

    it("should convert lexical state to HTML", () => {
        const transformer = createLexicalStateTransformer();

        const output = transformer.toHtml(stateMock);

        expect(output).toEqual(
            `<h1 dir="ltr"><span style=\"white-space: pre-wrap;\">Test CMS Title</span></h1><p dir="ltr"><br></p><p dir="ltr"><span style=\"white-space: pre-wrap;\">Testing a </span><a href="https://space.com" rel="noreferrer"><span style=\"white-space: pre-wrap;\">link</span></a><span style=\"white-space: pre-wrap;\"> for parsing</span></p><p dir="ltr"><span style=\"white-space: pre-wrap;\">Test CMS Paragraph</span></p><p dir="ltr"><br></p><blockquote dir="ltr"><span style=\"white-space: pre-wrap;\">Test quote from lexical </span><b><strong style=\"white-space: pre-wrap;\">CMS</strong></b></blockquote><p dir="ltr"><br></p><ul data-theme-list-style-id="list"><li value="1"><span style=\"white-space: pre-wrap;\">List item 1</span></li><li value="2"><span style=\"white-space: pre-wrap;\">List item 2</span></li><li value="3"><span style=\"white-space: pre-wrap;\">List item 3</span></li></ul><p><br></p>`
        );
    });
});
