import type React from "react";
import { useIdentity } from "~/presentation/security/hooks/useIdentity.js";

interface SecureRouteProps {
    children: React.ReactNode;
    permission?: string;
}
export const SecureRoute = ({
    children,
    permission
}: SecureRouteProps): React.ReactElement | null => {
    const { identity } = useIdentity();

    const hasPermission = permission ? Boolean(identity.getPermission(permission)) : true;

    if (hasPermission) {
        return children as unknown as React.ReactElement;
    }

    return null;
};
