import { Provider } from "@webiny/app-admin-core";
import React from "react";
import { SecurityProvider as ContextProvider } from "./contexts/Security";

const SecurityProviderHOC = Component => {
    return function SecurityProvider({ children }) {
        return (
            <ContextProvider>
                <Component>{children}</Component>
            </ContextProvider>
        );
    };
};

export const Security = () => {
    return <Provider hoc={SecurityProviderHOC} />;
};
