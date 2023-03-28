import React, { createContext, useState } from "react";
import { TextBlockSelection, ToolbarType } from "~/types";
import { WebinyTheme } from "~/themes/webinyLexicalTheme";

export interface RichTextEditorContext {
    nodeIsText: boolean;
    setNodeIsText: (nodeIsText: boolean) => void;
    toolbarType?: ToolbarType;
    setToolbarType: (type: ToolbarType) => void;
    textBlockSelection: TextBlockSelection | null;
    setTextBlockSelection: (textBlockSelection: TextBlockSelection) => void;
    theme: WebinyTheme | undefined;
    setTheme: (theme: WebinyTheme) => void;
}

export const RichTextEditorContext = createContext<RichTextEditorContext | undefined>(undefined);

interface RichTextEditorProviderProps {
    children?: React.ReactNode | React.ReactNode[];
}

export const RichTextEditorProvider: React.FC<RichTextEditorProviderProps> = ({ children }) => {
    const [nodeIsText, setIsText] = useState<boolean>(false);
    const [toolbarType, setToolbarType] = useState<ToolbarType | undefined>();
    const [theme, setTheme] = useState<WebinyTheme | undefined>(undefined);
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
                setTheme
            }}
        >
            {children}
        </RichTextEditorContext.Provider>
    );
};
