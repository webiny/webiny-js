import { Extensions, AddMenu, AddRoute, Layout } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security/";
import { useSecurity } from "@webiny/app-security/";
import React, { memo } from "react";
import { ReactComponent as TenantIcon } from "./assets/business_black_24dp.svg";
import { TenantsView } from "./views/tenants";

const RoutesAndMenus = () => {
    const security = useSecurity();

    if (!security) {
        return;
    }

    const { currentTenant } = security.identity;

    if (currentTenant.id !== "root") {
        return null;
    }

    return (
        <HasPermission name={"tenantManager.tenants"}>
            <AddMenu id="tenantManager" label={`Tenant Manager`} icon={<TenantIcon />}>
                <AddMenu id={"tenantManager.tenants"} label={`Tenants`} path="/tenants" />
            </AddMenu>
            <AddRoute exact path={"/tenants"}>
                <Layout title={"Tenant Manager - Tenants"}>
                    <TenantsView />
                </Layout>
            </AddRoute>
        </HasPermission>
    );
};

const TenantManagerExtension = () => {
    return (
        <Extensions>
            <RoutesAndMenus />
        </Extensions>
    );
};

export const TenantManager = memo(TenantManagerExtension);
