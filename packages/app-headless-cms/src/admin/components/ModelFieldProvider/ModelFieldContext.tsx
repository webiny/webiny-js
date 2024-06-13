import React from "react";
import { CmsModelField } from "~/types";
import { createGenericContext } from "@webiny/app-admin";

export type ModelFieldContext = CmsModelField;

export const ModelFieldContext = React.createContext<ModelFieldContext | undefined>(undefined);

export interface ModelFieldProviderProps {
    field: CmsModelField;
    children: React.ReactNode;
}

export const ModelFieldProvider = ({ field, children }: ModelFieldProviderProps) => {
    return <ModelFieldContext.Provider value={field}>{children}</ModelFieldContext.Provider>;
};

const { Provider, useHook } = createGenericContext<{ index: number }>("FieldIndex");

export const ParentValueIndexProvider = Provider;

export const useParentValueIndex = () => {
    try {
        const context = useHook();
        return context.index;
    } catch {
        return -1;
    }
};
