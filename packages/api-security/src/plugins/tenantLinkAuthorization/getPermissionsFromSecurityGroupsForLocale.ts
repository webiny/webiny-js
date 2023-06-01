import { SecurityPermission } from "~/types";

export const getPermissionsFromSecurityGroupsForLocale = (
    securityGroups: Array<{ permissions: SecurityPermission[] }>,
    locale: string
) => {
    // First of all, if one of the permissions grants full-access, we can return it immediately.
    const fullAccessPermission = securityGroups
        .map(securityGroup => securityGroup.permissions)
        .flat()
        .find(permission => permission.name === "*");

    if (fullAccessPermission) {
        return [{ name: "*" }];
    }

    return securityGroups
        .filter(securityGroup => {
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
        .map(securityGroup => securityGroup.permissions)
        .flat();
};
