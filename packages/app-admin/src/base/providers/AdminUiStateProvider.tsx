import React from "react";
import { Providers } from "@webiny/admin-ui";
import { ComponentWithChildren } from "~/types";

interface AdminUiStateProviderProps {
    children: React.ReactNode;
}

export const createAdminUiStateProvider = () => (Component: ComponentWithChildren) => {
    return function AdminUiStateProvider({ children }: AdminUiStateProviderProps) {
        return (
            <Providers>
                <Component>{children}</Component>
            </Providers>
        );
    };
};
