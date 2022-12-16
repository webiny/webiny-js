import React, { createContext } from "react";
import { CmsEditorField } from "~/types";

interface EditorFieldProviderProps {
    field: CmsEditorField | null;
    children: React.ReactNode;
}

export const EditorFieldContext = createContext<CmsEditorField | null>(null);

export const EditorFieldProvider = ({ field, children }: EditorFieldProviderProps) => {
    return <EditorFieldContext.Provider value={field}>{children}</EditorFieldContext.Provider>;
};
