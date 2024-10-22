import { SecurityPermission } from "~/types";

// This function will list all permissions from an Identity's security groups and teams.
//
export const listPermissionsFromIdentityGroupsTeams = (
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
            securityGroup.permissions.map(permission => {
                return {
                    ...permission,
                    _src: "role:" + securityGroup.id
                };
            })
        )

        .flat();
};
