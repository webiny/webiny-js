import React, { useMemo, useCallback, Fragment, useState } from "react";
import { default as localStorage } from "store";
import { plugins } from "@webiny/plugins";
import { TenantHeaderLinkPlugin } from "@webiny/app/plugins/TenantHeaderLinkPlugin";
export const TenancyContext = React.createContext(null);
import { config as appConfig } from "@webiny/app/config";

export interface Tenant {
    id: string;
    name: string;
}

export type TenancyContextValue = {
    tenant: string | null;
    setTenant(tenant: string): void;
    isMultiTenant: boolean;
};

const LOCAL_STORAGE_KEY = "webiny_tenant";

function loadState() {
    return localStorage.get(LOCAL_STORAGE_KEY) || null;
}

function storeState(state) {
    localStorage.set(LOCAL_STORAGE_KEY, state);
}

const getInitialTenant = () => {
    const currentTenant = loadState();
    plugins.register(new TenantHeaderLinkPlugin(currentTenant || "root"));
    return currentTenant;
};

export const TenancyProvider = props => {
    const [currentTenant, setTenant] = useState(getInitialTenant);

    const changeTenant = useCallback(
        (tenant: string) => {
            if (!tenant) {
                localStorage.remove(LOCAL_STORAGE_KEY);

                window.location.pathname = "/";
            }

            if (!currentTenant) {
                plugins.register(new TenantHeaderLinkPlugin(tenant));
                setTenant(tenant);
                storeState(tenant);
                return;
            }

            storeState(tenant);
            window.location.pathname = "/";
        },
        [currentTenant]
    );

    const value = useMemo<TenancyContextValue>(
        () => ({
            tenant: currentTenant,
            setTenant: changeTenant,
            isMultiTenant: appConfig.getKey(
                "WEBINY_MULTI_TENANCY",
                process.env.REACT_APP_WEBINY_MULTI_TENANCY === "true"
            )
        }),
        [currentTenant]
    );

    return (
        <TenancyContext.Provider value={value}>
            <Fragment>{props.children}</Fragment>
        </TenancyContext.Provider>
    );
};
