import React from "react";
import { useParentRules } from "~/Fields/index.js";

export interface CanEditFieldProps {
    children: React.ReactNode;
}

export const CanEditField = ({ children }: CanEditFieldProps) => {
    const rules = useParentRules();

    if (!rules.canEdit || rules.disabled) {
        return null;
    }

    return <>{children}</>;
};
