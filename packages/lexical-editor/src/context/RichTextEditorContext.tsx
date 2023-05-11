import React, { createContext, useState } from "react";
import { TextBlockSelection, ThemeEmotionMap, ToolbarType } from "~/types";
import { WebinyTheme } from "~/themes/webinyLexicalTheme";
import { LexicalEditor } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

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
    activeEditor: LexicalEditor;
    setActiveEditor: (editor: LexicalEditor) => void;
    isEditable: boolean;
    setIsEditable: (isEditable: boolean) => void;
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
    const [editor] = useLexicalComposerContext();
    const [activeEditor, setActiveEditor] = useState(editor);
    const [isEditable, setIsEditable] = useState(() => editor.isEditable());
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
                activeEditor,
                setActiveEditor,
                isEditable,
                setIsEditable
            }}
        >
            {children}
        </RichTextEditorContext.Provider>
    );
};
