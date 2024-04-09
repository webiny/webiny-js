import React, { useMemo, useCallback, Fragment, useState } from "react";
import { default as localStorage } from "store";
import { plugins } from "@webiny/plugins";
import { TenantHeaderLinkPlugin } from "@webiny/app/plugins/TenantHeaderLinkPlugin";
import { useWcp } from "@webiny/app-admin";

export interface Tenant {
    id: string;
    name: string;
}

export interface TenancyContextValue {
    tenant: string | null;
    setTenant(tenant: string | null): void;
    isMultiTenant: boolean;
}

interface TenancyProviderProps {
    children: React.ReactNode;
}

export const TenancyContext = React.createContext<TenancyContextValue>({
    tenant: null,
    setTenant: () => {
        return void 0;
    },
    isMultiTenant: false
});

const LOCAL_STORAGE_KEY = "webiny_tenant";

function loadState(): string | null {
    return localStorage.get(LOCAL_STORAGE_KEY) || null;
}

function storeState(state: string) {
    localStorage.set(LOCAL_STORAGE_KEY, state);
}

const getInitialTenant = (): string | null => {
    // Check if `tenantId` query parameter is set. If it is, it takes precedence over any other source.
    const searchParams = new URLSearchParams(location.search);
    const tenantId = searchParams.get("tenantId");
    if (tenantId) {
        storeState(tenantId);
    }

    const currentTenant = loadState() || "root";
    plugins.register(new TenantHeaderLinkPlugin(currentTenant));
    return currentTenant;
};

const goToDashboard = () => {
    const url = new URL(window.location.toString());
    url.search = "";
    url.pathname = "/";
    window.location.href = url.toString();
};

export const TenancyProvider = (props: TenancyProviderProps) => {
    const [currentTenant, setTenant] = useState(getInitialTenant);
    const { canUseFeature } = useWcp();

    const changeTenant = useCallback(
        (tenant: string): void => {
            if (!tenant) {
                localStorage.remove(LOCAL_STORAGE_KEY);

                goToDashboard();
            }

            if (!currentTenant) {
                plugins.register(new TenantHeaderLinkPlugin(tenant));
                setTenant(tenant);
                storeState(tenant);
                return;
            }

            storeState(tenant);
            goToDashboard();
        },
        [currentTenant]
    );

    const value = useMemo<TenancyContextValue>(
        () => ({
            tenant: currentTenant,
            setTenant: changeTenant,
            isMultiTenant: canUseFeature("multiTenancy")
        }),
        [currentTenant]
    );

    return (
        <TenancyContext.Provider value={value}>
            <Fragment>{props.children}</Fragment>
        </TenancyContext.Provider>
    );
};
