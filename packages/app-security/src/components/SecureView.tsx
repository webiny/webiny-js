import * as React from "react";
import { hasScopes, hasRoles } from "@webiny/app-security";
import { ResourcesType } from "../identity";

export default ({
    children,
    scopes,
    roles
}: {
    children: any;
    scopes?: ResourcesType;
    roles?: ResourcesType;
}): React.ReactElement => {
    const checks = {
        scopes: scopes ? hasScopes(scopes) : true,
        roles: roles ? hasRoles(roles) : true
    };

    if (typeof children === "function") {
        return children(checks);
    }

    return checks.scopes && checks.roles ? children : null;
};
