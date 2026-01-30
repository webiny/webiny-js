import { useEffect, useState } from "react";
import { autorun } from "mobx";
import { useFeature } from "@webiny/app-admin";
import { CurrentTenantFeature } from "./feature.js";
import type { Tenant } from "../../shared/Tenant.js";

export const useCurrentTenant = () => {
    const { presenter } = useFeature(CurrentTenantFeature);
    // The app is not rendered till the tenant is loaded.
    // If this hook is used, it's safe to assume the tenant is loaded.
    const [tenant, setTenant] = useState(presenter.vm.tenant as Tenant);

    useEffect(() => {
        return autorun(() => {
            const tenant = presenter.vm.tenant;
            setTenant(tenant as Tenant);
        });
    }, []);

    return { tenant };
};
