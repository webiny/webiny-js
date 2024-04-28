import React, { createContext } from "react";
import { LexicalEditor } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { ThemeEmotionMap, WebinyTheme } from "@webiny/lexical-theme";
import { ToolbarActionPlugin } from "~/types";

export interface RichTextEditorContext {
    editor: LexicalEditor;
    theme?: WebinyTheme;
    themeEmotionMap?: ThemeEmotionMap;
    toolbarActionPlugins: ToolbarActionPlugin[];
}

export const RichTextEditorContext = createContext<RichTextEditorContext | undefined>(undefined);

interface RichTextEditorProviderProps {
    theme: WebinyTheme;
    themeEmotionMap?: ThemeEmotionMap;
    toolbarActionPlugins?: ToolbarActionPlugin[];
    children?: React.ReactNode | React.ReactNode[];
}

export const RichTextEditorProvider = ({
    themeEmotionMap,
    theme,
    toolbarActionPlugins = [],
    children
}: RichTextEditorProviderProps) => {
    const [editor] = useLexicalComposerContext();

    return (
        <RichTextEditorContext.Provider
            value={{
                editor,
                theme,
                themeEmotionMap,
                toolbarActionPlugins
            }}
        >
            {children}
        </RichTextEditorContext.Provider>
    );
};
