import React, { createContext, useState } from "react";
import { TextBlockSelection, ThemeEmotionMap, ToolbarType } from "~/types";
import { WebinyTheme } from "~/themes/webinyLexicalTheme";

export interface RichTextEditorContext {
    nodeIsText: boolean;
    setNodeIsText: (nodeIsText: boolean) => void;
    toolbarType?: ToolbarType;
    setToolbarType: (type: ToolbarType) => void;
    textBlockSelection: TextBlockSelection | null;
    setTextBlockSelection: (textBlockSelection: TextBlockSelection) => void;
    theme?: WebinyTheme;
    setTheme: (theme: WebinyTheme) => void;
    themeEmotionMap?: ThemeEmotionMap;
    setThemeEmotionMap: (themeEmotionMap?: ThemeEmotionMap) => void;
    actionPlugins: { type: string; plugin: Record<string, any> }[];
    setActionPlugins: (actionPlugins: { type: string; plugin: Record<string, any> }[]) => void;
}

export const RichTextEditorContext = createContext<RichTextEditorContext | undefined>(undefined);

interface RichTextEditorProviderProps {
    children?: React.ReactNode | React.ReactNode[];
}

export const RichTextEditorProvider: React.FC<RichTextEditorProviderProps> = ({ children }) => {
    const [nodeIsText, setIsText] = useState<boolean>(false);
    const [toolbarType, setToolbarType] = useState<ToolbarType | undefined>();
    const [theme, setTheme] = useState<WebinyTheme | undefined>(undefined);
    const [themeEmotionMap, setThemeEmotionMap] = useState<ThemeEmotionMap | undefined>(undefined);
    const [actionPlugins, setActionPlugins] = useState<
        { type: string; plugin: Record<string, any> }[]
    >([]);
    /*
     * @desc Keeps data from current user text selection like range selection, nodes, node key...
     */
    const [textBlockSelection, setTextBlockSelection] = useState<TextBlockSelection | null>(null);

    const setNodeIsText = (nodeIsText: boolean) => {
        setIsText(nodeIsText);
    };

    return (
        <RichTextEditorContext.Provider
            value={{
                nodeIsText,
                setNodeIsText,
                toolbarType,
                setToolbarType,
                textBlockSelection,
                setTextBlockSelection,
                theme,
                setTheme,
                themeEmotionMap,
                setThemeEmotionMap,
                actionPlugins,
                setActionPlugins
            }}
        >
            {children}
        </RichTextEditorContext.Provider>
    );
};
