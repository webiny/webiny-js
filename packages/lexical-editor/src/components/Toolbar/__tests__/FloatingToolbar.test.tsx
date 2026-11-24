// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import type { LexicalEditor } from "lexical";
import { $createParagraphNode, $createTextNode, $getRoot, BLUR_COMMAND } from "lexical";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { CompositionProvider } from "@webiny/react-composition";
import { createTheme } from "@webiny/lexical-theme";
import { TOGGLE_LINK_COMMAND } from "@webiny/lexical-nodes";
import { RichTextEditor } from "~/components/Editor/RichTextEditor.js";
import { LexicalEditorConfig } from "~/components/LexicalEditorConfig/LexicalEditorConfig.js";
import { FloatingToolbar } from "~/components/Toolbar/FloatingToolbar.js";
import { HIDE_FLOATING_TOOLBAR } from "~/commands/toolbar.js";

// jsdom doesn't lay out: a selection's range has no box.
Range.prototype.getBoundingClientRect = () => new DOMRect(100, 300, 60, 20);

const theme = createTheme({ colors: [], typography: {}, lexicalTokenPrefix: "lx", fontSizes: [] });
const editorRef: { current: LexicalEditor | null } = { current: null };

const renderEditor = async () => {
    render(
        <CompositionProvider>
            <LexicalEditorConfig>
                <LexicalEditorConfig.ToolbarElement
                    name={"bold"}
                    element={<button data-testid={"bold"} />}
                />
                <LexicalEditorConfig.ToolbarContainer
                    type={"floating"}
                    element={<FloatingToolbar />}
                />
            </LexicalEditorConfig>
            <RichTextEditor value={null} theme={theme}>
                <EditorRefPlugin editorRef={editorRef} />
            </RichTextEditor>
        </CompositionProvider>
    );
    await waitFor(() => expect(editorRef.current).not.toBeNull());
    await act(async () => {
        editorRef.current!.update(
            () => {
                $getRoot()
                    .clear()
                    .append($createParagraphNode().append($createTextNode("Contact us")));
            },
            { discrete: true }
        );
    });
};

const select = async (from: number, to: number) => {
    await act(async () => {
        editorRef.current!.update(
            () => {
                const text = $getRoot().getFirstDescendant()!;
                // @ts-expect-error A text node.
                text.select(from, to);
            },
            { discrete: true }
        );
    });
};

describe("FloatingToolbar", () => {
    afterEach(cleanup);

    it("shows the toolbar elements while text is selected, and not otherwise", async () => {
        await renderEditor();
        expect(screen.queryByTestId("bold")).toBeNull();

        await select(0, 7);
        await screen.findByTestId("bold");
        // In the overlays element (the body), not in the editor, so nothing clips it.
        expect(screen.getByTestId("bold").closest(".editor-shell")).toBeNull();
        expect(screen.getByTestId("bold").closest(".floating-toolbar")).not.toBeNull();

        await select(3, 3);
        await waitFor(() => expect(screen.queryByTestId("bold")).toBeNull());
    });

    it("steps aside while the link form opens", async () => {
        await renderEditor();
        await select(0, 7);
        await screen.findByTestId("bold");

        await act(async () => {
            editorRef.current!.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
        });

        await waitFor(() => expect(screen.queryByTestId("bold")).toBeNull());
    });

    it("hides on HIDE_FLOATING_TOOLBAR", async () => {
        await renderEditor();
        await select(0, 7);
        await screen.findByTestId("bold");

        await act(async () => {
            editorRef.current!.dispatchCommand(HIDE_FLOATING_TOOLBAR, undefined);
        });

        await waitFor(() => expect(screen.queryByTestId("bold")).toBeNull());
    });

    it("stays when focus moves into it, and hides when focus leaves the editor", async () => {
        await renderEditor();
        await select(0, 7);
        const bold = await screen.findByTestId("bold");

        await act(async () => {
            editorRef.current!.dispatchCommand(
                BLUR_COMMAND,
                new FocusEvent("blur", { relatedTarget: bold })
            );
        });
        expect(screen.queryByTestId("bold")).not.toBeNull();

        await act(async () => {
            editorRef.current!.dispatchCommand(
                BLUR_COMMAND,
                new FocusEvent("blur", { relatedTarget: document.body })
            );
        });
        await waitFor(() => expect(screen.queryByTestId("bold")).toBeNull());
    });
});
