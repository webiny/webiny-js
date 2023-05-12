import React from "react";
import { PbEditorElement } from "~/types";

export interface ElementContext {
    element: PbEditorElement;
}

export const ElementContext = React.createContext<ElementContext | undefined>(undefined);

export interface ElementProviderProps {
    element: PbEditorElement;
}

export const ElementProvider: React.FC<ElementProviderProps> = ({ element, children }) => {
    return <ElementContext.Provider value={{ element }}>{children}</ElementContext.Provider>;
};
