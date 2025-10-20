import React from "react";
import { Toast } from "~/Toast/index.js";
import { Tooltip } from "~/Tooltip/index.js";
import { type LinkComponent, DefaultLinkComponent } from "~/index.js";

export interface AdminUiContextValue {
    linkComponent: LinkComponent;
}

export const AdminUiContext = React.createContext<AdminUiContextValue>({
    linkComponent: DefaultLinkComponent
});

export interface AdminUiProviderProps {
    linkComponent?: LinkComponent;
    children: React.ReactNode;
}

export const AdminUiProvider = ({ children, linkComponent }: AdminUiProviderProps) => {
    return (
        <AdminUiContext.Provider value={{ linkComponent: linkComponent ?? DefaultLinkComponent }}>
            <Tooltip.Provider>{children}</Tooltip.Provider>
            <Toast.Provider />
        </AdminUiContext.Provider>
    );
};

export const useAdminUi = () => {
    return React.useContext(AdminUiContext);
};
