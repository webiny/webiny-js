import React, { useMemo } from "react";
import { CmsDynamicZoneTemplate } from "@webiny/app-headless-cms-common/types";

export interface TemplateContext {
    template: CmsDynamicZoneTemplate;
}

const TemplateContext = React.createContext<TemplateContext | undefined>(undefined);

export interface TemplateProviderProps {
    template: CmsDynamicZoneTemplate;
    children: React.ReactNode;
}

export const TemplateProvider = ({ template, children }: TemplateProviderProps) => {
    const context = useMemo(() => ({ template }), [template.id]);
    return <TemplateContext.Provider value={context}>{children}</TemplateContext.Provider>;
};

export function useTemplate() {
    return React.useContext(TemplateContext);
}
