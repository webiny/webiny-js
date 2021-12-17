import { Provider } from "@webiny/app-admin";
import React from "react";
import { I18NProvider as ContextProvider } from "./contexts/I18N";

const I18NProviderHOC = Component => {
    return function I18NProvider({ children }) {
        return (
            <ContextProvider>
                <Component>{children}</Component>
            </ContextProvider>
        );
    };
};

export const I18N = () => {
    return <Provider hoc={I18NProviderHOC} />;
};
