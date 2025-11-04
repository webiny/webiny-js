import type { SecurityPermission } from "~/types/security.js";

// This filter was introduced when we added the `teams` feature and the ability to
// have multiple security groups assigned to a user.
// Why? It's because we need to filter out permissions that are not relevant for the
// current locale. And we can only do that in the authorizer, while we still have
// permissions grouped by security groups and locale. Once we flatten the permissions,
// we lose the information about the locale.
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
