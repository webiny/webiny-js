import { Provider } from "@webiny/app-admin";
import React from "react";
import { TenancyProvider as ContextProvider } from "./contexts/Tenancy";

const TenancyProviderHOC = Component => {
    return function TenancyProvider({ children }) {
        return (
            <ContextProvider>
                <Component>{children}</Component>
            </ContextProvider>
        );
    };
};

export const Tenancy = () => {
    return <Provider hoc={TenancyProviderHOC} />;
};
