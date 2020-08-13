import * as React from "react";
import { useSecurity } from "..";

export default ({
    children,
    scopes,
    permissions
}: {
    children: any;
    scopes?: string[];
    permissions?: string[];
}): React.ReactElement => {
    if (!permissions && scopes) {
        permissions = scopes;
    }

    const { identity } = useSecurity();
    const hasPermission = permissions ? identity.hasPermission(permissions) : true;

    if (hasPermission) {
        return children;
    }

    return null;
};
