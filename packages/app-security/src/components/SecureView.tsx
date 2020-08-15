import * as React from "react";
import { useSecurity } from "..";

let warned = false;

export default ({
    children,
    scopes,
    permission
}: {
    children: any;
    scopes?: string[];
    permission: string;
}): React.ReactElement => {
    if (!permission && scopes) {
        !warned &&
            console.warn(
                `DEPRECATION WARNING: <SecureView> "scopes" prop is deprecated. Please upgrade to "permission" prop.`
            );
        warned = true;
        permission = scopes[0];
    }

    const { identity } = useSecurity();
    const hasPermission = permission ? identity.getPermission(permission) : true;

    if (typeof children === "function") {
        return children({ hasPermission });
    }

    return hasPermission ? children : null;
};
