import React from "react";
import { useModelField } from "~/ModelFieldProvider/useModelField.js";

export interface CanEditFieldProps {
    children: React.ReactNode;
}

export const CanEditField = ({ children }: CanEditFieldProps) => {
    const { permissions } = useModelField();

    if (!permissions.canEdit) {
        return null;
    }

    return <>{children}</>;
};
