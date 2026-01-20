import React, { createContext, useMemo } from "react";
import type { LexicalEditor } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { type EditorTheme, Theme } from "@webiny/lexical-theme";
import type { ToolbarActionPlugin } from "~/types.js";

export interface RichTextEditorContext {
    editor: LexicalEditor;
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

    const internalTheme = useMemo(
        () => new Theme(theme.colors, theme.typography, theme.tokens),
        [theme]
    );

    return (
        <RichTextEditorContext.Provider
            value={{
                editor,
                theme: internalTheme,
                toolbarActionPlugins
            }}
        >
            {children}
        </RichTextEditorContext.Provider>
    );
};
