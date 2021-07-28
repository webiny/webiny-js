import { useEffect } from "react";
import { TenantPlugin } from "@webiny/app-tenancy/plugins/TenantPlugin";
import { useSecurity } from "@webiny/app-security";
import { Tenant } from "@webiny/app-tenancy/contexts/Tenancy";
import { SecurityPermission } from "@webiny/app-security/types";
import { useTenancy } from "@webiny/app-tenancy/hooks/useTenancy";

interface TenantWithPermissions extends Tenant {
    permissions: SecurityPermission[];
}

export default new TenantPlugin(() => {
    const { tenant, onChange, setTenant } = useTenancy<TenantWithPermissions>();
    const { identity } = useSecurity();

    useEffect(() => {
        const off = onChange(tenant => {
            identity.setPermissions(tenant ? tenant.permissions : []);
        });

        if (!tenant) {
            setTenant(identity.access[0]);
        }

        return () => off();
    }, []);

    return null;
});
