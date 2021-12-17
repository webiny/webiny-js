import { Provider } from "@webiny/app-admin";
import React from "react";
import { PageBuilderProvider as ContextProvider } from "./contexts/PageBuilder";

const PageBuilderProviderHOC = Component => {
    return function PageBuilderProvider({ children }) {
        return (
            <ContextProvider>
                <Component>{children}</Component>
            </ContextProvider>
        );
    };
};

export const PageBuilder = () => {
    return <Provider hoc={PageBuilderProviderHOC} />;
};
