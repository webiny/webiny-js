import React from "react";
import { DevToolsSection } from "@webiny/app-admin";
import type { CmsModel } from "~/types.js";

export type ModelContext = CmsModel;

export const ModelContext = React.createContext<ModelContext | undefined>(undefined);

export interface ModelProviderProps {
    model: CmsModel;
    children: React.ReactNode;
}

export const ModelProvider = ({ model, children }: ModelProviderProps) => {
    return (
        <ModelContext.Provider value={model}>
            <DevToolsSection name={"Model"} group="CMS" data={model} views={"raw"} />
            {children}
        </ModelContext.Provider>
    );
};
