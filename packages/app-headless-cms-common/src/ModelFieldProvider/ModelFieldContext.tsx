import React from "react";
import type { CmsModelField } from "~/types/index.js";

export type ModelFieldContext = CmsModelField;

export const ModelFieldContext = React.createContext<ModelFieldContext | undefined>(undefined);

export interface ModelFieldProviderProps {
    field: CmsModelField;
    children: React.ReactNode;
}

export const ModelFieldProvider = ({ field, children }: ModelFieldProviderProps) => {
    return <ModelFieldContext.Provider value={field}>{children}</ModelFieldContext.Provider>;
};
