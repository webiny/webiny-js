import React from "react";
import { createProvider } from "@webiny/app";
import { AdminUiProvider } from "@webiny/admin-ui";

interface UiProvidersProps {
    children: React.ReactNode;
}

export const createUiProviders = () => {
    return createProvider(Component => {
        return function UiProviders({ children }: UiProvidersProps) {
            return (
                <AdminUiProvider linkComponent={"a"}>
                    <Component>{children}</Component>
                </AdminUiProvider>
            );
        };
    });
};
