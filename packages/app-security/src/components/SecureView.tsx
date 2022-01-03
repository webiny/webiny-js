import * as React from "react";
import { useSecurity } from "~/hooks/useSecurity";
import { SecurityPermission } from "~/types";

interface ChildrenRenderFunctionArgs<T extends SecurityPermission> {
    hasPermission: boolean;
    permission: T;
}

interface Props<T extends SecurityPermission> {
    children: ((args: ChildrenRenderFunctionArgs<T>) => React.ReactElement) | React.ReactElement;
    permission?: string;
}

function SecureView<T extends SecurityPermission>({
    children,
    permission
}: Props<T>): React.ReactElement {
    const { identity } = useSecurity();

    let hasPermission = false;
    let matchedPermission: T = null;
    if (identity) {
        matchedPermission = identity.getPermission<T>(permission);
        hasPermission = Boolean(matchedPermission);
    }

    if (typeof children === "function") {
        return children({ hasPermission, permission: matchedPermission });
    }

    return hasPermission ? children : null;
}

export default SecureView;
