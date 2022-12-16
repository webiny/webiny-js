import React from "react";
import { CmsEditorField } from "~/types";

export type FieldContext = CmsEditorField;

export const FieldContext = React.createContext<FieldContext | undefined>(undefined);

interface FieldProviderProps {
    field: CmsEditorField;
    children: React.ReactNode;
}

export const FieldProvider = ({ field, children }: FieldProviderProps) => {
    return <FieldContext.Provider value={field}>{children}</FieldContext.Provider>;
};
