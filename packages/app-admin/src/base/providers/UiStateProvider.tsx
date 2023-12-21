import React from "react";
import { UiProvider } from "@webiny/app/contexts/Ui";
import { ComponentWithChildren } from "~/types";

interface UiStateProviderProps {
    children: React.ReactNode;
}

export const createUiStateProvider = () => (Component: ComponentWithChildren) => {
    return function UiStateProvider({ children }: UiStateProviderProps) {
        return (
            <UiProvider>
                <Component>{children}</Component>
            </UiProvider>
        );
    };
};
