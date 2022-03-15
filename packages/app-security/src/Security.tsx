// Importing from `app-admin-core` and NOT from `app-admin`, to avoid circular dependency.
// This can be resolved in a different way, by changing the location of `AppInstaller` component (currently in `app-admin`).
// But this is a faster solution, as I'm really short on time :)
import React from "react";
import { Provider } from "@webiny/app-admin-core";
import { SecurityProvider as ContextProvider } from "./contexts/Security";

const SecurityProviderHOC = (Component: React.FC<any>): React.FC<any> => {
    return function SecurityProvider({ children }) {
        return (
            <ContextProvider>
                <Component>{children}</Component>
            </ContextProvider>
        );
    };
};

export const Security: React.FC = () => {
    /**
     * TODO @ts-refactor somewhere down the line in Provider.
     * Provider expects ComponentType and we are giving it the React.FC.
     * It works, just the types are wrong.
     */
    // @ts-ignore
    return <Provider hoc={SecurityProviderHOC} />;
};
