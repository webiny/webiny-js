import React from "react";
import { UiProvider } from "@webiny/app/contexts/Ui";

interface UiStateProviderProps {
    children: React.ReactNode;
}

export const createUiStateProvider = () => (Component: React.ComponentType<unknown>) => {
    return function UiStateProvider({ children }: UiStateProviderProps) {
        return (
            <UiProvider>
                <Component>{children}</Component>
            </UiProvider>
        );
    };
};
