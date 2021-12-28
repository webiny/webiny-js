import { Compose, LocaleSelector } from "@webiny/app-admin";
import React, { Fragment, memo } from "react";
import { AddTenantFormField } from "./components/AddTenantFormField";
import { CurrentTenant } from "./components/CurrentTenant";
import { DomainsModule } from "./modules/domains";
import { TenantsModule } from "./modules/tenants";
import { ThemesModule } from "./modules/themes";

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
        <Fragment>
            <Compose component={LocaleSelector} with={TenantIndicator} />
            <TenantsModule />
            <DomainsModule />
            <ThemesModule />
        </Fragment>
    );
};

export const TenantManager = memo(TenantManagerExtension);

export { AddTenantFormField };
export { AddTheme } from "./components/AddTheme";
