import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import { Provider, HigherOrderComponent } from "@webiny/app-admin";
import installation from "./plugins/installation";
import { TenancyProvider as ContextProvider } from "./contexts/Tenancy";

interface TenancyProviderProps {
    children: React.ReactNode;
}
const TenancyProviderHOC: HigherOrderComponent = (Component): React.VFC<TenancyProviderProps> => {
    return function TenancyProvider({ children }) {
        return (
            <ContextProvider>
                <Component>{children}</Component>
            </ContextProvider>
        );
    };
};

export const TenancyExtension: React.VFC = () => {
    plugins.register(installation);

    return <Provider hoc={TenancyProviderHOC} />;
};

export const Tenancy = memo(TenancyExtension);
