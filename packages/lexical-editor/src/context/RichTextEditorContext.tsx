import React, {createContext, useState } from "react";

export interface RichTextEditorContextProps {
    nodeIsText: boolean;
    setNodeIsText: (nodeIsText: boolean) => void;
}

export const RichTextEditorContext = createContext<RichTextEditorContextProps>({
    nodeIsText: false,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setNodeIsText: () => {}
});

interface RichTextEditorProviderProps {
    children?: React.ReactNode | React.ReactNode[];
}


export const RichTextEditorProvider: React.FC<RichTextEditorProviderProps> = ({ children}) => {
    const [nodeIsText, setIsText] = useState<boolean>(false);
    const setNodeIsText = (nodeIsText: boolean) => {
        setIsText(nodeIsText);
    }

    return (<RichTextEditorContext.Provider value={{
        nodeIsText,
        setNodeIsText
    }}>
        {children}
    </RichTextEditorContext.Provider>);
};


