import React from "react";
import { CmsEditorField } from "~/types";

export type ModelFieldContext = CmsEditorField;

export const ModelFieldContext = React.createContext<ModelFieldContext | undefined>(undefined);

export interface ModelFieldProviderProps {
    field: CmsEditorField;
    children: React.ReactNode;
}

export const ModelFieldProvider = ({ field, children }: ModelFieldProviderProps) => {
    return <ModelFieldContext.Provider value={field}>{children}</ModelFieldContext.Provider>;
};
