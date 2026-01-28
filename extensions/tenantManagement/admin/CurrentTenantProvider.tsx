import React from "react";
import { createProviderPlugin } from "webiny/admin";
import { OverlayLoader } from "webiny/admin/ui";
import { useCurrentTenantQuery } from "./useCurrentTenantQuery.js";
import type { Tenant } from "../shared/Tenant.js";

export interface CurrentTenant {
    tenant: Tenant;
}

const CurrentTenantContext = React.createContext<CurrentTenant | undefined>(undefined);

interface CurrentTenantProps {
    children: React.ReactNode;
}

const CurrentTenant = ({ children }: CurrentTenantProps) => {
    const { loading, tenant, error } = useCurrentTenantQuery();

    if (loading) {
        return <OverlayLoader title={"Loading tenant..."} />;
    }

    if (error) {
        return <OverlayLoader title={error.message} />;
    }

    if (!tenant) {
        return <OverlayLoader title={"Unable to load tenant!"} />;
    }

    return (
        <CurrentTenantContext.Provider value={{ tenant }}>
            {children}
        </CurrentTenantContext.Provider>
    );
};

export const CurrentTenantProvider = createProviderPlugin(Component => {
    return function CurrentTenantProvider({ children }) {
        return (
            <CurrentTenant>
                <Component>
                    {children}
                </Component>
            </CurrentTenant>
        );
    };
});

export function useCurrentTenant() {
    const context = React.useContext(CurrentTenantContext);

    if (!context) {
        throw Error(`Missing CurrentTenantProvider in the component hierarchy!`);
    }

    return context;
}
