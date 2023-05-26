import React from "react";
import { CmsModel } from "@webiny/app-headless-cms-common/types";

export type ModelContext = CmsModel;

export const ModelContext = React.createContext<ModelContext | undefined>(undefined);

export interface ModelProviderProps {
    model: CmsModel;
    children: React.ReactNode;
}

export const ModelProvider = ({ model, children }: ModelProviderProps) => {
    return <ModelContext.Provider value={model}>{children}</ModelContext.Provider>;
};
