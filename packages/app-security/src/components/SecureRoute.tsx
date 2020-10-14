import * as React from "react";
import { useSecurity } from "..";
import { SecureRouteErrorPlugin } from "@webiny/app-security/types";
import { getPlugin } from "@webiny/plugins";

let warned = false;

export default ({
    children,
    scopes,
    permission
}: {
    children: any;
    scopes?: string[];
    permission?: string;
}): React.ReactElement => {
    if (!permission && scopes) {
        !warned &&
            console.warn(
                `DEPRECATION WARNING: <SecureRoute> "scopes" prop is deprecated. Please upgrade to "permission" prop.`
            );
        warned = true;
        permission = scopes[0];
    }

    const { identity } = useSecurity();
    const hasPermission = permission ? identity.getPermission(permission) : true;

    if (hasPermission) {
        return children;
    }

    const plugin = getPlugin<SecureRouteErrorPlugin>("secure-route-error");
    if (!plugin) {
        return null;
    }

    return plugin.render();
};
