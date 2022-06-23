import { Compose, LocaleSelector, useWcp } from "@webiny/app-admin";
import React, { Fragment, memo } from "react";
import { AddTenantFormField } from "./components/AddTenantFormField";
import { CurrentTenant } from "./components/CurrentTenant";
import { DomainsModule } from "./modules/domains";
import { TenantsModule } from "./modules/tenants";

const TenantIndicator = (LocaleSelector: React.FC): React.FC => {
    return function TenantIndicator() {
        return (
            <Fragment>
                <CurrentTenant />
                <LocaleSelector />
            </Fragment>
        );
    };
};

const TenantManagerExtension: React.FC = () => {
    const { canUseFeature } = useWcp();
    if (!canUseFeature("multiTenancy")) {
        return null;
    }

    return (
        <Fragment>
            <Compose component={LocaleSelector} with={TenantIndicator} />
            <TenantsModule />
            <DomainsModule />
        </Fragment>
    );
};

export const TenantManager: React.FC = memo(TenantManagerExtension);

export { useCurrentTenant } from "./hooks/useCurrentTenant";
export { IsRootTenant, IsNotRootTenant, IsTenant } from "./components/IsRootTenant";
export { AddTenantFormField };
