import React from "react";
import { PbEditorElement } from "~/types";

export interface ElementContext {
    element: PbEditorElement;
}

export const ElementContext = React.createContext<ElementContext | undefined>(undefined);

export interface ElementProviderProps {
    element: PbEditorElement;
    children: React.ReactNode;
}

export const ElementProvider = ({ element, children }: ElementProviderProps) => {
    return <ElementContext.Provider value={{ element }}>{children}</ElementContext.Provider>;
};
