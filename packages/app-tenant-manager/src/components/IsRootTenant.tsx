import React, { Fragment } from "react";
import { useSecurity } from "@webiny/app-security";
import { Tenant } from "@webiny/app-tenancy";

interface IsTenantProps {
    condition(tenant: Tenant): boolean;
}

export const IsTenant: React.FC<IsTenantProps> = ({ condition, children }) => {
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

export const IsRootTenant: React.FC = ({ children }) => {
    return <IsTenant condition={tenant => tenant.id === "root"}>{children}</IsTenant>;
};

export const IsNotRootTenant: React.FC = ({ children }) => {
    return <IsTenant condition={tenant => tenant.id !== "root"}>{children}</IsTenant>;
};
