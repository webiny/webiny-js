import React, {createContext, useState} from "react";
export interface EditorConfigContext {
    scope?: string;

    setScope: (scope: string) => void;

    targetScope?: string;

    setTargetScope: (scope: string) => void;
}

export const EditorConfigContext = createContext<EditorConfigContext | undefined>(undefined);

interface EditorConfigProps {
    scope: string;
    children?: React.ReactNode | React.ReactNode[];
}


export const EditorConfigProvider: React.FC<EditorConfigProps> = ({ children , scope}) => {
    const [scopeValue, setScope] = useState<string>(scope);
    const [targetScope, setTargetScope] = useState<string | undefined>();
    return (
        <EditorConfigContext.Provider
            value={{
                scope: scopeValue,
                setScope,
                targetScope,
                setTargetScope
            }}
        >
            {children}
        </EditorConfigContext.Provider>
    );
};
