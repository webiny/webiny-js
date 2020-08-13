import * as React from "react";
import { useSecurity } from "..";

type Permissions = string[];

export default ({
    children,
    scopes,
    permissions
}: {
    children: any;
    scopes?: Permissions;
    permissions?: Permissions;
}): React.ReactElement => {
    if (!permissions && scopes) {
        permissions = scopes;
    }

    const { identity } = useSecurity();
    const hasPermission = permissions ? identity.hasPermission(permissions) : true;

    if (typeof children === "function") {
        return children({ hasPermission });
    }

    return hasPermission ? children : null;
};
