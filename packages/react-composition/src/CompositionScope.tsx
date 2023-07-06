import React from "react";

export interface CompositionScopeContext {
    name: string;
}

const CompositionScopeContext = React.createContext<CompositionScopeContext | undefined>(undefined);

interface CompositionScopeProps {
    name: string;
    children: React.ReactNode;
}

export const CompositionScope = ({ name, children }: CompositionScopeProps) => {
    return (
        <CompositionScopeContext.Provider value={{ name }}>
            {children}
        </CompositionScopeContext.Provider>
    );
};

export function useCompositionScope() {
    const context = React.useContext(CompositionScopeContext);
    if (!context) {
        return undefined;
    }
    return context.name;
}
