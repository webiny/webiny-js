import React, { useState, useMemo, useEffect, useCallback } from "react";

import { plugins } from "@webiny/plugins";
import { useSecurity } from "@webiny/app-security";
import { Tenant } from "@webiny/app-security-tenancy/types";
export const TenancyContext = React.createContext(null);

export type TenancyContextValue = {
    tenant: Tenant | null;
    tenants: Tenant[];
    setTenant(tenant: Tenant): void;
};

export const TenancyProvider = props => {
    const [currentTenant, setCurrentTenant] = useState<Tenant>(null);
    const { identity } = useSecurity();

    const changeTenant = useCallback(tenant => {
        identity.setPermissions(tenant ? tenant.permissions : []);
        setCurrentTenant(tenant);

        plugins.register({
            name: "apollo-link-context-tenant",
            type: "apollo-link-context",
            setContext(request, context) {
                if (!tenant) {
                    return context;
                }

                return {
                    headers: {
                        ...context.headers,
                        "x-tenant": tenant.id
                    }
                };
            }
        });
    }, []);

    useEffect(() => {
        // Set current tenant to the first tenant user has access to.
        const link = identity.access[0];
        if (link) {
            changeTenant(link);
        }
    }, []);

    const value = useMemo<TenancyContextValue>(
        () => ({
            tenant: currentTenant,
            tenants: identity.access,
            setTenant: changeTenant
        }),
        [identity]
    );

    return (
        <TenancyContext.Provider value={value}>
            {currentTenant ? props.children : null}
        </TenancyContext.Provider>
    );
};
