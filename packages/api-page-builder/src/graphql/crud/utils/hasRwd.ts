import { SecurityPermission } from "@webiny/api-security/types";

export default (permission: SecurityPermission, rwd?: string) => {
    if (typeof permission.rwd !== "string") {
        return true;
    }

    return permission.rwd.includes(rwd);
};
