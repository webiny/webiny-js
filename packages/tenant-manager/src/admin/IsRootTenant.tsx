import React, { Fragment } from "react";
import { useAuthentication } from "@webiny/app-admin";
import type { Tenant } from "../shared/Tenant.js";
import { useCurrentTenant } from "./CurrentTenant/useCurrentTenant.js";

interface IsTenantProps {
    condition(tenant: Tenant): boolean;
    children: React.ReactNode;
}

interface RootTenantProps {
    children: React.ReactNode;
}

export const IsTenant = ({ condition, children }: IsTenantProps) => {
    const { identity } = useAuthentication();
    const { tenant } = useCurrentTenant();

    if (!identity.isAuthenticated) {
        return null;
    }

    if (!condition(tenant)) {
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
