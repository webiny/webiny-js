import { Compose, LocaleSelector, useWcp } from "@webiny/app-admin";
import React, { Fragment, memo } from "react";
import { AddTenantFormField } from "./components/AddTenantFormField";
import { CurrentTenant } from "./components/CurrentTenant";
import { DomainsModule } from "./modules/domains";
import { TenantsModule } from "./modules/tenants";

const TenantIndicator = (LocaleSelector: React.ComponentType) => {
    return function TenantIndicator() {
        return (
            <Fragment>
                <CurrentTenant />
                <LocaleSelector />
            </Fragment>
        );
    };
};

let mounted = 0;

const TenantManagerExtension = () => {
    // Make sure only a single instance of this component is mounted.
    // `useEffect` is too slow, because several elements mount at almost the same time.
    // That's the nature of this component, and we only need this precaution for pre-5.29.0 projects.
    if (mounted > 0) {
        return null;
    }

    mounted++;

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

export const TenantManager: React.ComponentType = memo(TenantManagerExtension);

export { useCurrentTenant } from "./hooks/useCurrentTenant";
export { IsRootTenant, IsNotRootTenant, IsTenant } from "./components/IsRootTenant";
export { AddTenantFormField };
