import React, { useMemo, useEffect } from "react";
import { DiContainerProvider, useFeature } from "@webiny/app";
import { plugins } from "@webiny/plugins";
import { TenantHeaderLinkPlugin } from "@webiny/app/plugins/TenantHeaderLinkPlugin.js";
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
        console.log("First mount");
        return () => {
            console.log("Unmount");
        };
    }, []);

    // Handle query string on mount
    useEffect(() => {
        if (tenantId) {
            service.setTenant(tenantId);
        }

        // Register plugin for current tenant
        const currentTenant = service.getCurrentTenant();
        if (currentTenant) {
            // TODO: remove this once we can decorate the GQL client!
            plugins.register(new TenantHeaderLinkPlugin(currentTenant));
        }
    }, [tenantId]);

    // Handle tenant changes (redirect on change)
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
