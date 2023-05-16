import { PbSecurityPermission } from "~/graphql/types";

export default (permissions: PbSecurityPermission | PbSecurityPermission[], rwd?: string): boolean => {
    if (!Array.isArray(permissions)) {
        permissions = [permissions];
    }

    if (!rwd) {
        return true;
    }

    // Is there a permission that doesn't restrict RWD permissions, that means all RWD permissions are allowed.
    const permissionWithoutRwdRestrictions = permissions.some(permission => {
        return typeof permission.rwd !== "string";
    });

    if (permissionWithoutRwdRestrictions) {
        return true;
    }

    // If there is no permission that doesn't restrict RWD permissions, that means we need to check if the RWD.
    return permissions.some(permission => {
        return permission.rwd && permission.rwd.includes(rwd);
    });
};
