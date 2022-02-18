import { SecurityPermission } from "@webiny/api-security/types";

export default (permission: SecurityPermission, rwd?: string): boolean => {
    if (typeof permission.rwd !== "string" || !rwd) {
        return true;
    }

    return permission.rwd.includes(rwd);
};
