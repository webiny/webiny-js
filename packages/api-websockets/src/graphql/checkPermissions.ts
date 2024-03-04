import { NotAuthorizedError } from "@webiny/api-security";
import { Context, WebsocketsPermission } from "~/types";

/**
 * @throws
 */
export const checkPermissions = async (
    context: Context,
    check: { rwd?: string } = {}
): Promise<void> => {
    const permissions = await context.security.getPermissions<WebsocketsPermission>("websockets");

    const relevant = permissions.filter(current => {
        if (check.rwd && !hasRwd(current, check.rwd)) {
            return false;
        }

        return true;
    });

    if (relevant.length === 0) {
        throw new NotAuthorizedError();
    }
};

const hasRwd = (
    permissions: WebsocketsPermission | WebsocketsPermission[],
    rwd: string
): boolean => {
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
