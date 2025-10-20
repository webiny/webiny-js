import React, { useMemo, useEffect, useRef } from "react";
import { DiContainerProvider, useFeature, useRouter } from "@webiny/app";
import { plugins } from "@webiny/plugins";
import { TenantHeaderLinkPlugin } from "@webiny/app/plugins/TenantHeaderLinkPlugin.js";
import { TenancyFeature } from "~/features/tenancy/feature.js";
import { Routes } from "~/routes.js";

interface TenancyProviderProps {
    children: React.ReactNode;
}

export const TenancyProvider = (props: TenancyProviderProps) => {
    const isFirstMount = useRef(true);
    const { goToRoute } = useRouter();
    const { service, createTenantContainer } = useFeature(TenancyFeature);

    const tenantId = useMemo(() => {
        return new URLSearchParams(window.location.search).get("tenantId");
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
            // Skip redirect on initial mount
            if (isFirstMount.current) {
                isFirstMount.current = false;
                return;
            }

            goToRoute(Routes.Dashboard);
        });
    }, [service]);

    const tenantContainer = useMemo(() => {
        return createTenantContainer();
    }, [service.getCurrentTenant()]);

    return <DiContainerProvider container={tenantContainer}>{props.children}</DiContainerProvider>;
};
