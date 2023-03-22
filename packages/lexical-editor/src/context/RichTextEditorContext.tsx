import React, { createContext, useState } from "react";
import { TextBlockSelection, ToolbarType } from "~/types";

export interface RichTextEditorContext {
    nodeIsText: boolean;
    setNodeIsText: (nodeIsText: boolean) => void;
    toolbarType?: ToolbarType;
    setToolbarType: (type: ToolbarType) => void;
    textBlockSelection: TextBlockSelection | null;
    setTextBlockSelection: (textBlockSelection: TextBlockSelection) => void;
}

export const RichTextEditorContext = createContext<RichTextEditorContext | undefined>(undefined);

interface RichTextEditorProviderProps {
    children?: React.ReactNode | React.ReactNode[];
}

export const RichTextEditorProvider: React.FC<RichTextEditorProviderProps> = ({ children }) => {
    const [nodeIsText, setIsText] = useState<boolean>(false);
    const [toolbarType, setToolbarType] = useState<ToolbarType | undefined>();
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
                setTextBlockSelection
            }}
        >
            {children}
        </RichTextEditorContext.Provider>
    );
};
