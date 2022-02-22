import * as React from "react";
import { useSecurity } from "~/hooks/useSecurity";
import { SecurityPermission } from "~/types";

interface ChildrenRenderFunctionArgs<T extends SecurityPermission> {
    hasPermission: boolean;
    permission: T | null;
}

interface Props<T extends SecurityPermission> {
    children: ((args: ChildrenRenderFunctionArgs<T>) => React.ReactElement) | React.ReactElement;
    permission?: string;
}

function SecureView<T extends SecurityPermission>({
    children,
    permission
}: Props<T>): React.ReactElement | null {
    const { getPermission } = useSecurity();

    let hasPermission = false;
    let matchedPermission: T | null = null;
    if (permission) {
        matchedPermission = getPermission<T>(permission);
        hasPermission = Boolean(matchedPermission);
    }

    if (typeof children === "function") {
        return children({
            hasPermission,
            permission: matchedPermission
        });
    }

    return hasPermission ? children : null;
}

export default SecureView;
