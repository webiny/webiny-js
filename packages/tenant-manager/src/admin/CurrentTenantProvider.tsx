import React from "react";
import { createProviderPlugin } from "@webiny/app-admin";
import { CurrentTenant } from "./CurrentTenant/CurrentTenant.js";

export const CurrentTenantProvider = createProviderPlugin(Component => {
    return function CurrentTenantProvider({ children }) {
        return (
            <CurrentTenant>
                <Component>{children}</Component>
            </CurrentTenant>
        );
    };
});
