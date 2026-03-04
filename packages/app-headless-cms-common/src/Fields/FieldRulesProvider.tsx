import React, { createContext, useContext } from "react";
import type { EffectiveFieldRules } from "./useFieldRules.js";

const FieldRulesContext = createContext<EffectiveFieldRules>({
    canView: true,
    canEdit: true,
    hidden: false,
    disabled: false
});

interface FieldRulesProviderProps {
    rules: EffectiveFieldRules;
    children: React.ReactNode;
}

export const FieldRulesProvider = ({ rules, children }: FieldRulesProviderProps) => {
    return <FieldRulesContext.Provider value={rules}>{children}</FieldRulesContext.Provider>;
};

export const useParentRules = (): EffectiveFieldRules => {
    return useContext(FieldRulesContext);
};
