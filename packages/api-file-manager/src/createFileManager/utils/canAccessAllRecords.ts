import { hasFullAccess } from "./hasFullAccess";
import { FilePermission } from "~/types";

export const canAccessAllRecords = (permissions: FilePermission[]): boolean => {
    // First pass - check if we have full access to Page Builder.
    if (hasFullAccess(permissions)) {
        return true;
    }

    // Second pass - if there's at least one permission that doesn't
    // prevent us from accessing non-owned records, then we grant access.
    return permissions.some(p => !p.own);
};
