import React, { useContext } from "react";
import type { Permission } from "./types.js";

interface PermissionValueContextValue {
    value: Permission[];
    onChange: (value: Permission[]) => void;
}

const PermissionValueContext = React.createContext<PermissionValueContextValue | null>(null);

export const PermissionValueProvider = ({
    value,
    onChange,
    children
}: PermissionValueContextValue & { children: React.ReactNode }) => {
    return (
        <PermissionValueContext.Provider value={{ value, onChange }}>
            {children}
        </PermissionValueContext.Provider>
    );
};

export function usePermissionValue(): PermissionValueContextValue {
    const ctx = useContext(PermissionValueContext);
    if (!ctx) {
        throw new Error("usePermissionValue must be used within a PermissionValueProvider");
    }
    return ctx;
}
