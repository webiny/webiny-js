import React, { createContext, useState } from "react";
import { LexicalEditor } from "lexical";
import type { ThemeEmotionMap, WebinyTheme } from "@webiny/lexical-theme";
import { ToolbarActionPlugin, ToolbarType } from "~/types";

export interface RichTextEditorContext {
    toolbarType?: ToolbarType;
    setToolbarType: (type: ToolbarType) => void;
    theme?: WebinyTheme;
    setTheme: (theme: WebinyTheme) => void;
    themeEmotionMap?: ThemeEmotionMap;
    setThemeEmotionMap: (themeEmotionMap?: ThemeEmotionMap) => void;
    toolbarActionPlugins: ToolbarActionPlugin[];
    setToolbarActionPlugins: (actionPlugins: ToolbarActionPlugin[]) => void;
    activeEditor?: LexicalEditor;
    setActiveEditor: (editor: LexicalEditor) => void;
    isEditable: boolean;
    setIsEditable: (isEditable: boolean) => void;
}

export const RichTextEditorContext = createContext<RichTextEditorContext | undefined>(undefined);

interface RichTextEditorProviderProps {
    children?: React.ReactNode | React.ReactNode[];
}

export const RichTextEditorProvider = ({ children }: RichTextEditorProviderProps) => {
    const [toolbarType, setToolbarType] = useState<ToolbarType | undefined>();
    const [theme, setTheme] = useState<WebinyTheme | undefined>(undefined);
    const [themeEmotionMap, setThemeEmotionMap] = useState<ThemeEmotionMap | undefined>(undefined);
    const [toolbarActionPlugins, setToolbarActionPlugins] = useState<ToolbarActionPlugin[]>([]);
    const [activeEditor, setActiveEditor] = useState<LexicalEditor>();
    const [isEditable, setIsEditable] = useState<boolean>(false);

    return (
        <RichTextEditorContext.Provider
            value={{
                toolbarType,
                setToolbarType,
                theme,
                setTheme,
                themeEmotionMap,
                setThemeEmotionMap,
                activeEditor,
                setActiveEditor,
                isEditable,
                setIsEditable,
                toolbarActionPlugins,
                setToolbarActionPlugins
            }}
        >
            {children}
        </RichTextEditorContext.Provider>
    );
};
