/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { RichTextLexicalRenderer } from "~/index";
import React from "react";
import {
    defaultHeadingValue,
    defaultParagraphValue,
    expectedHeadingRenderedValue,
    expectedParagraphRenderedValue
} from "./lexical-content";

describe("Test Rich Lexical Renderer", () => {
    it("Paragraph string value type is rendered", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer value={defaultParagraphValue} />);
        // ACT
        expect(container.innerHTML).toContain(expectedParagraphRenderedValue);
    });

    it("Header object value type is rendered", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer value={defaultHeadingValue} />);
        // ACT
        expect(container.innerHTML).toContain(expectedHeadingRenderedValue);
    });

    /* it("Complex CMS saved content is rendered", async () => {
        // ARRANGE
        render(<RichTextLexicalRenderer value={expectedHeadingRenderedValue} />);
        // ACT
        await screen.findByText(expectedHeadingRenderedValue);
    });*/
});
