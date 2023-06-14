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
    LexicalJsonCmsDataInput,
    notCorrectValue
} from "./lexical-content";
import { emptyEditorContent, LexicalCmsInputRender } from "./lexical-render";

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

    it("Lexical CMS input includes title, paragraph, list and quote", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer value={LexicalJsonCmsDataInput} />);
        // ACT
        expect(container.innerHTML).toEqual(LexicalCmsInputRender);
    });
});
