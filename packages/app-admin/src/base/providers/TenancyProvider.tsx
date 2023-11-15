import React, { useMemo, useCallback, Fragment, useState, useEffect } from "react";
import { plugins } from "@webiny/plugins";
import { TenantHeaderLinkPlugin } from "@webiny/app/plugins/TenantHeaderLinkPlugin";
import { useWcp } from "@webiny/app-wcp";

export interface Tenant {
    id: string;
    name: string;
}

export interface TenancyContextValue {
    tenant: string | null;
    setTenant(tenant: string | null): void;
    isMultiTenant: boolean;
}

export const TenancyContext = React.createContext<TenancyContextValue>({
    tenant: null,
    setTenant: () => {
        return void 0;
    },
    isMultiTenant: false
});

const tryMatchingTenantInPathname = () => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0 && pathParts[0].startsWith("t_")) {
        return pathParts[0].substring(2);
    }
    return undefined;
};

const getInitialTenant = (): string | null => {
    // Check if `tenantId` query parameter is set. If it is, it takes precedence over any other source.
    const searchParams = new URLSearchParams(location.search);
    const tenantId = searchParams.get("tenantId");

    const currentTenant = tenantId || tryMatchingTenantInPathname() || "root";
    plugins.register(new TenantHeaderLinkPlugin(currentTenant));
    return currentTenant;
};

export interface TenancyProviderProps {
    onTenant?: (tenantId: string) => void;
    children: React.ReactElement;
}

export const TenancyProvider = ({ onTenant, children }: TenancyProviderProps) => {
    const [currentTenant, setTenant] = useState(getInitialTenant);
    const { canUseFeature } = useWcp();

    const changeTenant = useCallback(
        (tenant: string): void => {
            if (!tenant) {
                window.location.pathname = "/";
            }

            if (!currentTenant) {
                plugins.register(new TenantHeaderLinkPlugin(tenant));
                setTenant(tenant);
                return;
            }

            window.location.pathname = tenant === "root" ? "/" : `/t_${tenant}/`;
        },
        [currentTenant]
    );

    useEffect(() => {
        if (currentTenant) {
            onTenant && onTenant(currentTenant);

            if (
                currentTenant !== "root" &&
                !window.location.pathname.startsWith(`/t_${currentTenant}`)
            ) {
                window.location.pathname = `/t_${currentTenant}/`;
            }
        }
    }, [onTenant, currentTenant]);

    const value = useMemo<TenancyContextValue>(
        () => ({
            tenant: currentTenant,
            setTenant: changeTenant,
            isMultiTenant: canUseFeature("multiTenancy")
        }),
        [currentTenant]
    );

    if (!currentTenant) {
        return null;
    }

    return (
        <TenancyContext.Provider value={value}>
            <Fragment>{children}</Fragment>
        </TenancyContext.Provider>
    );
};
