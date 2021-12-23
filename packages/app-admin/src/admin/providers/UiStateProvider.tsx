import React from "react";
import { UiProvider } from "@webiny/app/contexts/Ui";

export const createUiStateProvider = () => (Component: React.ComponentType<unknown>) => {
    return function UiStateProvider({ children }) {
        return (
            <UiProvider>
                <Component>{children}</Component>
            </UiProvider>
        );
    };
};
