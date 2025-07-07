"use client";
import React from "react";

const ElementSlotDepthContext = React.createContext<number>(0);

interface ElementSlotDepthProviderProps {
    depth: number;
    children: React.ReactNode;
}

export const ElementSlotDepthProvider = ({ children, depth }: ElementSlotDepthProviderProps) => {
    return (
        <ElementSlotDepthContext.Provider value={depth}>
            {children}
        </ElementSlotDepthContext.Provider>
    );
};

export const useElementSlotDepth = () => {
    const context = React.useContext(ElementSlotDepthContext);

    return context ?? 0;
};
