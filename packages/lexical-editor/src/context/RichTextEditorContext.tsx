import React, { createContext, useState } from "react";
import { ToolbarType } from "~/types";

export interface RichTextEditorContext {
    nodeIsText: boolean;
    setNodeIsText: (nodeIsText: boolean) => void;
    toolbarType?: ToolbarType;
    setToolbarType: (type: ToolbarType) => void;
}

export const RichTextEditorContext = createContext<RichTextEditorContext | undefined>(undefined);

interface RichTextEditorProviderProps {
    children?: React.ReactNode | React.ReactNode[];
}

export const RichTextEditorProvider: React.FC<RichTextEditorProviderProps> = ({ children }) => {
    const [nodeIsText, setIsText] = useState<boolean>(false);
    const [toolbarType, setToolbarType] = useState<ToolbarType | undefined>();
    const setNodeIsText = (nodeIsText: boolean) => {
        setIsText(nodeIsText);
    };

    return (
        <RichTextEditorContext.Provider
            value={{
                nodeIsText,
                setNodeIsText,
                toolbarType,
                setToolbarType
            }}
        >
            {children}
        </RichTextEditorContext.Provider>
    );
};
