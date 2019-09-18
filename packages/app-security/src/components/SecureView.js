// @flow
import * as React from "react";
import { hasScopes, hasRoles } from "@webiny/app-security";

export default ({ children, scopes, roles }: Object): React.Node => {
    const checks = {
        scopes: scopes ? hasScopes(scopes) : true,
        roles: roles ? hasRoles(roles) : true
    };

    if (typeof children === "function") {
        return children(checks);
    }

    return checks.scopes && checks.roles ? children : null;
};
