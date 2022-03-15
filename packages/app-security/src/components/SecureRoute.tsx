import React from "react";
import { useSecurity } from "~/hooks/useSecurity";
import { SecureRouteErrorPlugin } from "~/types";
import { plugins } from "@webiny/plugins";

interface SecureRouteProps {
    children: React.ReactNode;
    permission?: string;
}
export default ({ children, permission }: SecureRouteProps): React.ReactElement | null => {
    const security = useSecurity();

    if (!security) {
        return null;
    }

    const { identity, getPermission } = security;

    if (!identity) {
        return null;
    }

    let hasPermission = false;
    if (identity) {
        hasPermission = permission ? Boolean(getPermission(permission)) : true;
    }

    if (hasPermission) {
        return children as unknown as React.ReactElement;
    }

    const plugin = plugins.byName<SecureRouteErrorPlugin>("secure-route-error");
    if (!plugin) {
        return null;
    }

    return plugin.render();
};
