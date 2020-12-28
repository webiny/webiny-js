import React from "react";

export const ResponsiveModeContext = React.createContext(null);

export type ResponsiveModeContextValue = {
    // TODO: add type
    editorMode: string;
    setEditorMode: () => void;
};

export type PageBuilderProviderProps = {
    children?: React.ReactChild | React.ReactChild[];
};

export const ResponsiveModeProvider = ({ children }: PageBuilderProviderProps) => {
    const [editorMode, setEditorMode] = React.useState("desktop");

    return (
        <ResponsiveModeContext.Provider
            value={{
                editorMode,
                setEditorMode
            }}
        >
            {children}
        </ResponsiveModeContext.Provider>
    );
};
