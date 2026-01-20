import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
import { theme } from "./theme";
import { RichTextLexicalRenderer } from "~/index";

describe("Test Rich Lexical Renderer", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("Paragraph string value type is rendered", async () => {
        // ARRANGE
        const { container } = render(
            <RichTextLexicalRenderer theme={theme} value={defaultParagraphValue} />
        );

        await vi.runAllTimersAsync();

        // ASSERT
        expect(container.innerHTML).toContain(expectedParagraphRenderedValue);
    });

    it("Header object value type is rendered", async () => {
        // ARRANGE
        const { container } = render(
            <RichTextLexicalRenderer theme={theme} value={defaultHeadingValue} />
        );
        await vi.runAllTimersAsync();
        // ASSERT
        expect(container.innerHTML).toContain(expectedHeadingRenderedValue);
    });

    it("Handle null as value", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer theme={theme} value={null} />);
        await vi.runAllTimersAsync();
        // ASSERT
        expect(container.innerHTML).toEqual(emptyEditorContent);
    });

    it("Handle undefined as value", async () => {
        // ARRANGE
        const { container } = render(<RichTextLexicalRenderer theme={theme} value={undefined} />);
        await vi.runAllTimersAsync();
        // ASSERT
        expect(container.innerHTML).toEqual(emptyEditorContent);
    });

    it("Lexical CMS input includes title, paragraph, list and quote", async () => {
        // ARRANGE
        const { container } = render(
            <RichTextLexicalRenderer theme={theme} value={LexicalJsonCmsDataInput} />
        );
        await vi.runAllTimersAsync();
        // ASSERT
        expect(container.innerHTML).toEqual(LexicalCmsInputRender);
    });

    it("Lexical CMS input with theme", async () => {
        // ARRANGE
        const { container } = render(
            <RichTextLexicalRenderer theme={theme} value={LexicalJsonCmsDataInput} />
        );
        await vi.runAllTimersAsync();
        // ASSERT
        // editor is here
        expect(container.innerHTML.includes("editor")).toBeTruthy();
        // emotion produced css classes are here
        expect(container.innerHTML.includes("wby-")).toBeTruthy();
    });
});
