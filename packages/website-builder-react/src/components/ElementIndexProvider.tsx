"use client";
import React from "react";

const ElementIndexContext = React.createContext<number>(0);

interface ElementIndexProviderProps {
    index: number;
    children: React.ReactNode;
}

export const ElementIndexProvider = ({ children, index }: ElementIndexProviderProps) => {
    return <ElementIndexContext.Provider value={index}>{children}</ElementIndexContext.Provider>;
};

export const useElementIndex = () => {
    const context = React.useContext(ElementIndexContext);

    return context ?? 0;
};
