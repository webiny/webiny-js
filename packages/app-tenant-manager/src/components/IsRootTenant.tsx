import React, { Fragment } from "react";
import { useSecurity } from "@webiny/app-security";
import { Tenant } from "@webiny/app-tenancy";

interface IsTenantProps {
    condition(tenant: Tenant): boolean;
    children: React.ReactNode;
}

interface RootTenantProps {
    children: React.ReactNode;
}

export const IsTenant = ({ condition, children }: IsTenantProps) => {
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

export const IsRootTenant = ({ children }: RootTenantProps) => {
    return <IsTenant condition={tenant => tenant.id === "root"}>{children}</IsTenant>;
};

export const IsNotRootTenant = ({ children }: RootTenantProps) => {
    return <IsTenant condition={tenant => tenant.id !== "root"}>{children}</IsTenant>;
};
