import React, { Fragment, FC } from "react";
import { useSecurity } from "@webiny/app-security";
import { Tenant } from "@webiny/app-tenancy";

interface IsTenantProps {
    condition(tenant: Tenant): boolean;
}

export const IsTenant: FC<IsTenantProps> = ({ condition, children }) => {
    const security = useSecurity();

    if (!security) {
        return null;
    }

    const { currentTenant } = security.identity;

    if (!condition(currentTenant)) {
        return null;
    }

    return <Fragment>{children}</Fragment>;
};

export const IsRootTenant: FC = ({ children }) => {
    return <IsTenant condition={tenant => tenant.id === "root"}>{children}</IsTenant>;
};

export const IsNotRootTenant: FC = ({ children }) => {
    return <IsTenant condition={tenant => tenant.id !== "root"}>{children}</IsTenant>;
};
