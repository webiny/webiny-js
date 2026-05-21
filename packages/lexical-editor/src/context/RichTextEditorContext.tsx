import React, { createContext, useCallback, useMemo } from "react";
import type { LexicalEditor } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { type EditorTheme, Theme } from "@webiny/lexical-theme";
import type { ToolbarActionPlugin } from "~/types.js";

export interface RichTextEditorContext {
    editor: LexicalEditor;
    getOverlaysElement: () => HTMLElement;
    toolbarActionPlugins: ToolbarActionPlugin[];
    theme: Theme;
}

export const RichTextEditorContext = createContext<RichTextEditorContext | undefined>(undefined);

interface RichTextEditorProviderProps {
    theme: EditorTheme;
    toolbarActionPlugins?: ToolbarActionPlugin[];
    children?: React.ReactNode | React.ReactNode[];
}

export const RichTextEditorProvider = ({
    theme,
    toolbarActionPlugins = [],
    children
}: RichTextEditorProviderProps) => {
    const [editor] = useLexicalComposerContext();

    const getOverlaysElement = useCallback(() => {
        const rootElement = editor.getRootElement();
        if (!rootElement) {
            return document.body;
        }

        const dialogContent = rootElement.closest("[role='dialog']");
        if (dialogContent) {
            return dialogContent as HTMLElement;
        }

        const shell = rootElement.closest(".editor-shell");
        if (!shell) {
            return document.body;
        }
        const overlays = shell.previousElementSibling;

        return (overlays ?? document.body) as HTMLElement;
    }, [editor]);

    const internalTheme = useMemo(
        () =>
            new Theme({
                colors: theme.colors,
                typography: theme.typography,
                fontSizes: theme.fontSizes,
                tokens: theme.tokens
            }),
        [theme]
    );

    return (
        <RichTextEditorContext.Provider
            value={{
                editor,
                getOverlaysElement,
                theme: internalTheme,
                toolbarActionPlugins
            }}
        >
            {children}
        </RichTextEditorContext.Provider>
    );
};
