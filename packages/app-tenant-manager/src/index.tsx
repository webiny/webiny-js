import { Extensions, AddMenu, AddRoute, Layout, Compose, LocaleSelector } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security/";
import { useSecurity } from "@webiny/app-security/";
import React, { Fragment, memo } from "react";
import { ReactComponent as TenantIcon } from "./assets/business_black_24dp.svg";
import { CurrentTenant } from "./plugins/currentTenant";
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

const TenantIndicator = LocaleSelector => {
    return function TenantIndicator() {
        return (
            <Fragment>
                <CurrentTenant />
                <LocaleSelector />
            </Fragment>
        );
    };
};

const TenantManagerExtension = () => {
    return (
        <Extensions>
            <Compose component={LocaleSelector} with={TenantIndicator} />
            <RoutesAndMenus />
        </Extensions>
    );
};

export const TenantManager = memo(TenantManagerExtension);
