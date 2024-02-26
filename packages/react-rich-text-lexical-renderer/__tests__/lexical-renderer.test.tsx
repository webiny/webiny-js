/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";
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
import theme from "./theme";
import { RichTextLexicalRenderer } from "~/index";

describe("Test Rich Lexical Renderer", () => {
    it("Paragraph string value type is rendered", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer value={defaultParagraphValue} />);
        // ASSERT
        expect(container.innerHTML).toContain(expectedParagraphRenderedValue);
    });

    it("Header object value type is rendered", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer value={defaultHeadingValue} />);
        // ASSERT
        expect(container.innerHTML).toContain(expectedHeadingRenderedValue);
    });

    it("Handle null as value", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer value={null} />);
        // ASSERT
        expect(container.innerHTML).toEqual(emptyEditorContent);
    });

    it("Handle undefined as value", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer value={undefined} />);
        // ASSERT
        expect(container.innerHTML).toEqual(emptyEditorContent);
    });

    it("Handle wrong lexical value", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer value={notCorrectValue} />);
        // ASSERT
        expect(container.innerHTML).toEqual(emptyEditorContent);
    });

    it("Lexical CMS input includes title, paragraph, list and quote", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer value={LexicalJsonCmsDataInput} />);
        // ASSERT
        expect(container.innerHTML).toEqual(LexicalCmsInputRender);
    });

    it("Lexical CMS input with theme", async () => {
        // ARRANGE
        const { container } = render(
            <RichTextLexicalRenderer value={LexicalJsonCmsDataInput} theme={theme} />
        );
        // ASSERT
        // editor is here
        expect(container.innerHTML.includes("editor")).toBeTruthy();
        // emotion produced css classes are here
        expect(container.innerHTML.includes("css-")).toBeTruthy();
        // `css-99wy28` is a class generated for `paragraph1` styles defined in the `theme`.
        expect(container.innerHTML.includes("css-99wy28")).toBeTruthy();
    });
});
