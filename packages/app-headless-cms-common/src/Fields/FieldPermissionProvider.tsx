import React, { createContext, useContext } from "react";
import type { FieldPermissions } from "./getFieldPermissions.js";

const FieldPermissionContext = createContext<FieldPermissions>({
    canView: true,
    canEdit: true
});

interface FieldPermissionProviderProps {
    permissions: FieldPermissions;
    children: React.ReactNode;
}

export const FieldPermissionProvider = ({
    permissions,
    children
}: FieldPermissionProviderProps) => {
    return (
        <FieldPermissionContext.Provider value={permissions}>
            {children}
        </FieldPermissionContext.Provider>
    );
};

export const useFieldPermissions = (): FieldPermissions => {
    return useContext(FieldPermissionContext);
};
