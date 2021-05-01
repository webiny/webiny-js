import * as React from "react";
import { useSecurity } from "..";
import { SecurityPermission } from "../types";

let warned = false;

interface ChildrenRenderFunctionArgs<T extends SecurityPermission> {
    hasPermission: boolean;
    permission: T;
}

interface Props<T extends SecurityPermission> {
    children: ((args: ChildrenRenderFunctionArgs<T>) => React.ReactElement) | React.ReactElement;
    scopes?: string[];
    permission?: string;
}

function SecureView<T extends SecurityPermission>({
    children,
    scopes,
    permission
}: Props<T>): React.ReactElement {
    if (!permission && scopes) {
        !warned &&
            console.warn(
                `DEPRECATION WARNING: <SecureView> "scopes" prop is deprecated. Please upgrade to "permission" prop! [${scopes.join(
                    ","
                )}]`
            );
        warned = true;
        permission = scopes[0];
    }

    const { identity } = useSecurity();
    const matchedPermission = identity.getPermission<T>(permission);

    const hasPermission = Boolean(matchedPermission);

    if (typeof children === "function") {
        return children({ hasPermission, permission: matchedPermission });
    }

    return hasPermission ? children : null;
}

export default SecureView;
