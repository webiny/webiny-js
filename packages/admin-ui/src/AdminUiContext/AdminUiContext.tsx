import React from "react";
import { Toast } from "~/Toast/index.js";
import { Tooltip } from "~/Tooltip/index.js";

export interface AdminUiProviderProps {
    linkComponent?: any;
    children: React.ReactNode;
}

export const AdminUiContext = React.createContext<Omit<AdminUiProviderProps, "children">>({});

export const AdminUiProvider = ({ children, ...adminUiProps }: AdminUiProviderProps) => {
    return (
        <AdminUiContext.Provider value={adminUiProps}>
            <Tooltip.Provider>{children}</Tooltip.Provider>
            <Toast.Provider />
        </AdminUiContext.Provider>
    );
};

export const useAdminUi = () => {
    return React.useContext(AdminUiContext);
}