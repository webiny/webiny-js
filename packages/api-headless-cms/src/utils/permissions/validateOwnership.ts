import { SecurityContext } from "@webiny/api-security/types";
import { BaseCmsSecurityPermission } from "~/types";
import { checkOwnership, OwnableRecord } from "./checkOwnership";

export const validateOwnership = (
    context: SecurityContext,
    permissions: BaseCmsSecurityPermission[],
    record: OwnableRecord
) => {
    try {
        checkOwnership(context, permissions, record);
        return true;
    } catch {
        return false;
    }
};
