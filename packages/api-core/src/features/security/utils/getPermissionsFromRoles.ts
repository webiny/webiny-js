import type { SecurityPermission } from "~/types/security.js";

// This filter was introduced when we added the `teams` feature and the ability to
// have multiple security roles assigned to a user.
export const getPermissionsFromRoles = (
    securityGroups: Array<{ permissions: SecurityPermission[]; id: string }>
) => {
    return securityGroups.flatMap(securityRole =>
        securityRole.permissions.map(permission => {
            return {
                ...permission,
                _src: "role:" + securityRole.id
            };
        })
    );
};
