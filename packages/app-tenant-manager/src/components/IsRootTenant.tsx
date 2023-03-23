import React, { Fragment } from "react";
import { useSecurity } from "@webiny/app-security";
import { Tenant } from "@webiny/app-tenancy";

interface IsTenantProps {
    condition(tenant: Tenant): boolean;
    children: React.ReactNode;
}

export const IsTenant: React.VFC<IsTenantProps> = ({ condition, children }) => {
    const security = useSecurity();

    if (!security || !security.identity) {
        return null;
    }

    const { currentTenant } = security.identity;

    if (!condition(currentTenant)) {
        return null;
    }

    return <Fragment>{children}</Fragment>;
};

interface IsRootTenantProps {
    children: React.ReactNode;
}
export const IsRootTenant: React.VFC<IsRootTenantProps> = ({ children }) => {
    return <IsTenant condition={tenant => tenant.id === "root"}>{children}</IsTenant>;
};

interface IsNotRootTenant {
    children: React.ReactNode;
}
export const IsNotRootTenant: React.VFC<IsNotRootTenant> = ({ children }) => {
    return <IsTenant condition={tenant => tenant.id !== "root"}>{children}</IsTenant>;
};
