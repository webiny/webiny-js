import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import type { LexicalEditor } from "lexical";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { createTheme } from "@webiny/lexical-theme";
import { RichTextEditorProvider } from "~/context/RichTextEditorContext.js";
import { StateHandlingPlugin } from "./StateHandlingPlugin.js";

const theme = createTheme({ colors: [], typography: {}, lexicalTokenPrefix: "lx", fontSizes: [] });

const editorRef: { current: LexicalEditor | null } = { current: null };

const Editor = (props: { value: string | null; onChange: (value: string) => void }) => {
    return (
        <LexicalComposer initialConfig={{ namespace: "test", onError: e => console.error(e) }}>
            <RichTextEditorProvider theme={theme}>
                <RichTextPlugin
                    contentEditable={<ContentEditable />}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <EditorRefPlugin editorRef={editorRef} />
                <StateHandlingPlugin value={props.value} onChange={props.onChange} />
            </RichTextEditorProvider>
        </LexicalComposer>
    );
};

/** Replaces the editor content and waits past the plugin's 300ms debounce. */
const type = async (text: string) => {
    await act(async () => {
        editorRef.current!.update(() => {
            const paragraph = $createParagraphNode();
            if (text) {
                paragraph.append($createTextNode(text));
            }
            $getRoot().clear().append(paragraph);
        });
        await vi.advanceTimersByTimeAsync(400);
    });
};

const textOf = (value: string) => {
    return editorRef.current!.parseEditorState(value).read(() => $getRoot().getTextContent());
};

describe("StateHandlingPlugin", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it("emits the empty state when a field that started empty is typed into and then cleared", async () => {
        // Like the admin form: `onChange` keeps its identity, and the saved value comes back as `value`.
        const onChange = vi.fn();
        const { rerender } = render(<Editor value={null} onChange={onChange} />);

        await type("Hello");
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(textOf(onChange.mock.lastCall![0])).toBe("Hello");

        rerender(<Editor value={onChange.mock.lastCall![0]} onChange={onChange} />);

        await type("");
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(textOf(onChange.mock.lastCall![0])).toBe("");
    });

    it("emits nothing for an empty field nobody typed into", async () => {
        const onChange = vi.fn();
        render(<Editor value={null} onChange={onChange} />);

        await type("");

        expect(onChange).not.toHaveBeenCalled();
    });
});
