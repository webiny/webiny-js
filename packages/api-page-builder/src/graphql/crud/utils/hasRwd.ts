import { PbSecurityPermission } from "~/graphql/types";

export default (permission: PbSecurityPermission, rwd?: string): boolean => {
    if (typeof permission.rwd !== "string" || !rwd) {
        return true;
    }

    return permission.rwd.includes(rwd);
};
