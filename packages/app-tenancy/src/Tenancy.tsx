import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import { Provider } from "@webiny/app-admin";
import installation from "./plugins/installation";
import { TenancyProvider as ContextProvider } from "./contexts/Tenancy";

const TenancyProviderHOC = (Component: React.FC): React.FC => {
    return function TenancyProvider({ children }) {
        return (
            <ContextProvider>
                <Component>{children}</Component>
            </ContextProvider>
        );
    };
};

export const TenancyExtension: React.FC = () => {
    plugins.register(installation);

    return <Provider hoc={TenancyProviderHOC} />;
};

export const Tenancy = memo(TenancyExtension);
