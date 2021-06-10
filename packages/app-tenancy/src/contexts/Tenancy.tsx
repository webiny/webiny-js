import React, { useState, useMemo, useCallback, Fragment, useRef } from "react";
import { plugins } from "@webiny/plugins";
import { useSecurity } from "@webiny/app-security";
import { TenantHeaderLinkPlugin } from "@webiny/app/plugins/TenantHeaderLinkPlugin";
import { TenantPlugin } from "../plugins/TenantPlugin";
export const TenancyContext = React.createContext(null);

export interface Tenant {
    id: string;
    name: string;
}

export type TenancyContextValue<TTenant = Tenant> = {
    tenant: TTenant | null;
    tenants: TTenant[];
    setTenant(tenant: TTenant): void;
    onChange(cb: (tenant: TTenant) => void);
};

export const TenancyProvider = props => {
    const [currentTenant, setCurrentTenant] = useState<Tenant>(null);
    const { identity } = useSecurity();
    const onChangeCallbacks = useRef(new Set<Function>());

    const tenantPlugins = plugins.byType<TenantPlugin>(TenantPlugin.type);

    /**
     * Create plugin elements. Once mounted, they will attach to Tenancy using `useTenancy()` hook.
     * Why mounting an element? Because that will allow the plugin authors to access any available context
     * using hooks and we won't need to think about all the possible dependencies we need to provide to the plugin.
     */
    const pluginElements = useMemo(() => {
        return tenantPlugins.map(plugin => plugin.render());
    }, [tenantPlugins]);

    const changeTenant = useCallback(async (tenant: Tenant) => {
        const callbacks = onChangeCallbacks.current.values();
        for (const callback of callbacks) {
            callback(tenant);
        }
        setCurrentTenant(tenant);
        plugins.register(new TenantHeaderLinkPlugin(tenant.id));
    }, []);

    const value = useMemo<TenancyContextValue>(
        () => ({
            tenant: currentTenant,
            tenants: identity.access,
            setTenant: changeTenant,
            onChange: cb => {
                onChangeCallbacks.current.add(cb);
                return () => onChangeCallbacks.current.delete(cb);
            }
        }),
        [identity]
    );

    return (
        <TenancyContext.Provider value={value}>
            <Fragment>
                {pluginElements}
                {currentTenant ? props.children : null}
            </Fragment>
        </TenancyContext.Provider>
    );
};
