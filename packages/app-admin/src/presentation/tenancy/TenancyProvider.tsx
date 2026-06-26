import React, { useMemo, useEffect } from "react";
import { DiContainerProvider, useFeature } from "@webiny/app";
import { TenancyFeature } from "~/features/tenancy/feature.js";

interface TenancyProviderProps {
    children: React.ReactNode;
}

export const TenancyProvider = (props: TenancyProviderProps) => {
    const { service, createTenantContainer } = useFeature(TenancyFeature);

    const tenantId = useMemo(() => {
        return new URLSearchParams(window.location.search).get("tenantId");
    }, []);

    useEffect(() => {
        if (tenantId) {
            service.setTenant(tenantId);
        }
    }, [tenantId]);

    useEffect(() => {
        return service.onTenantChange(() => {
            window.location.replace(window.location.origin);
        });
    }, [service]);

    const tenantContainer = useMemo(() => {
        return createTenantContainer();
    }, [service.getCurrentTenant()]);

    return <DiContainerProvider container={tenantContainer}>{props.children}</DiContainerProvider>;
};
