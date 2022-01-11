import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import { Provider } from "@webiny/app-admin";
import installation from "./plugins/installation";
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

export const TenancyExtension = () => {
    plugins.register(installation);

    return <Provider hoc={TenancyProviderHOC} />;
};

export const Tenancy = memo(TenancyExtension);
