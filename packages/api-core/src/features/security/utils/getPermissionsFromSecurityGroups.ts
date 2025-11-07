import type { SecurityPermission } from "~/types/security.js";

// This filter was introduced when we added the `teams` feature and the ability to
// have multiple security groups assigned to a user.
export const getPermissionsFromSecurityGroups = (
    securityGroups: Array<{ permissions: SecurityPermission[]; id: string }>
) => {
    return securityGroups
        .map(securityGroup =>
            securityGroup.permissions.map(permission => {
                return {
                    ...permission,
                    _src: "role:" + securityGroup.id
                };
            })
        )

        .flat();
};
