import { SecurityPermission } from "~/types";

// This filter was introduced when we added the `teams` feature and the ability to
// have multiple security groups assigned to a user.
// Why? It's because we need to filter out permissions that are not relevant for the
// current locale. And we can only do that in the authorizer, while we still have
// permissions grouped by security groups and locale. Once we flatten the permissions,
// we lose the information about the locale.
export const getPermissionsFromSecurityGroupsForLocale = (
    securityGroups: Array<{ permissions: SecurityPermission[]; id: string }>,
    locale: string
) => {
    return securityGroups
        .filter(securityGroup => {
            // If one of the permissions grants full-access, we can return it immediately.
            const fullAccessPermission = securityGroup.permissions.find(
                permission => permission.name === "*"
            );

            if (fullAccessPermission) {
                return true;
            }

            const contentPermissionsObject = securityGroup.permissions.find(
                permissionsObject => permissionsObject.name === "content.i18n"
            );

            if (!contentPermissionsObject) {
                return false;
            }

            if (Array.isArray(contentPermissionsObject.locales)) {
                return contentPermissionsObject.locales.includes(locale);
            }

            return true;
        })
        .map(securityGroup =>
            securityGroup.permissions.map(sg => {
                return {
                    ...sg,
                    _src: securityGroup.id
                };
            })
        )

        .flat();
};
