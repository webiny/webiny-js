// Importing from `app-admin-core` and NOT from `app-admin`, to avoid circular dependency.
// This can be resolved in a different way, by changing the location of `AppInstaller` component (currently in `app-admin`).
// But this is a faster solution, as I'm really short on time :)
import { Provider } from "@webiny/app-admin-core";
import React from "react";
import { SecurityProvider as ContextProvider } from "./contexts/Security";

const SecurityProviderHOC = (Component: React.FC): React.FC => {
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
