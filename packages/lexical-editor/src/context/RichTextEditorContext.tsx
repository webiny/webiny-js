import React, { createContext, useState } from "react";

export interface RichTextEditorContext {
    nodeIsText: boolean;
    setNodeIsText: (nodeIsText: boolean) => void;
}

export const RichTextEditorContext = createContext<RichTextEditorContext | undefined>(undefined);

interface RichTextEditorProviderProps {
    children?: React.ReactNode | React.ReactNode[];
}

export const RichTextEditorProvider: React.FC<RichTextEditorProviderProps> = ({ children }) => {
    const [nodeIsText, setIsText] = useState<boolean>(false);
    const setNodeIsText = (nodeIsText: boolean) => {
        setIsText(nodeIsText);
    };

    return (
        <RichTextEditorContext.Provider
            value={{
                nodeIsText,
                setNodeIsText
            }}
        >
            {children}
        </RichTextEditorContext.Provider>
    );
};
