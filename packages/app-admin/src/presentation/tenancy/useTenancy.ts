import { useState, useEffect } from "react";
import { autorun } from "mobx";
import { TenancyFeature } from "~/features/tenancy/feature.js";
import { useFeature } from "@webiny/app";

export function useTenancy() {
    const { service } = useFeature(TenancyFeature);

    const [tenant, setTenant] = useState(() => service.getCurrentTenant());
    const [isMultiTenant, setIsMultiTenant] = useState(() => service.getIsMultiTenant());

    useEffect(() => {
        return autorun(() => {
            setTenant(service.getCurrentTenant());
            setIsMultiTenant(service.getIsMultiTenant());
        });
    }, [service]);

    return {
        tenant,
        isMultiTenant,
        setTenant: (id: string | null) => service.setTenant(id),
        onTenantChange: (callback: (tenantId: string | null) => void) => {
            service.onTenantChange(callback);
        }
    };
}
