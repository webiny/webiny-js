import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import { Provider } from "@webiny/app-admin";
import installation from "./plugins/installation";
import { TenancyProvider as ContextProvider } from "./contexts/Tenancy";

interface TenancyProviderHOCProps {
    children: React.ReactNode;
}

const TenancyProviderHOC = (Component: React.ComponentType<TenancyProviderHOCProps>) => {
    return function TenancyProvider({ children }: TenancyProviderHOCProps) {
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
