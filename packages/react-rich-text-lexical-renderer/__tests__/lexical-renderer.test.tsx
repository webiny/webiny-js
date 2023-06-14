/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";
import { RichTextLexicalRenderer } from "~/index";
import React from "react";
import {
    defaultHeadingValue,
    defaultParagraphValue,
    expectedHeadingRenderedValue,
    expectedParagraphRenderedValue,
    notCorrectValue
} from "./lexical-content";
import { emptyEditorContent } from "./lexical-render";

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

    it("Handle null as value", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer value={null} />);
        // ACT
        expect(container.innerHTML).toEqual(emptyEditorContent);
    });

    it("Handle undefined as value", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer value={undefined} />);
        // ACT
        expect(container.innerHTML).toEqual(emptyEditorContent);
    });

    it("Handle wrong lexical value", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer value={notCorrectValue} />);
        // ACT
        expect(container.innerHTML).toEqual(emptyEditorContent);
    });

    /* it("Complex CMS saved content is rendered", async () => {
        // ARRANGE
        render(<RichTextLexicalRenderer value={expectedHeadingRenderedValue} />);
        // ACT
        await screen.findByText(expectedHeadingRenderedValue);
    });*/
});
