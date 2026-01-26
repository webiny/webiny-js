import { useState, useEffect } from "react";
import { autorun } from "mobx";
import { useFeature } from "@webiny/app";
import { TenancyFeature } from "~/features/tenancy/feature.js";

export function useTenantContext() {
    const { service } = useFeature(TenancyFeature);

    const [tenant, setTenant] = useState(() => service.getCurrentTenant());

    useEffect(() => {
        return autorun(() => {
            setTenant(service.getCurrentTenant());
        });
    }, [service]);

    return {
        tenant,
        setTenant: (id: string | null) => service.setTenant(id),
        onTenantChange: (callback: (tenantId: string | null) => void) => {
            service.onTenantChange(callback);
        }
    };
}
