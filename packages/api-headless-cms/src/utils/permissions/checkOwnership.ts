import { NotAuthorizedError } from "@webiny/api-security";
import { SecurityContext } from "@webiny/api-security/types";
import { BaseCmsSecurityPermission, CmsIdentity } from "~/types";
import { hasFullAccess } from "./hasFullAccess";
import { canAccessAllRecords } from "./canAccessAllRecords";

export interface OwnableRecord {
    createdBy?: CmsIdentity;
    ownedBy?: CmsIdentity;
}

export const checkOwnership = (
    context: SecurityContext,
    permissions: BaseCmsSecurityPermission[],
    record: OwnableRecord
) => {
    // First pass - check if we have full access to Page Builder.
    if (hasFullAccess(permissions)) {
        return;
    }

    // Second pass - if there's at least one permission that doesn't
    // prevent us from accessing non-owned records, then we grant access.
    if (canAccessAllRecords(permissions)) {
        return;
    }

    // If we got here, that means we didn't encounter a permission object
    // that gives us the ability to access non-owned records.
    const identity = context.security.getIdentity();
    const owner = identity && record.ownedBy?.id === identity.id;
    const creator = identity && record.createdBy?.id === identity.id;

    if (!owner && !creator) {
        throw new NotAuthorizedError({
            data: {
                reason: `You are not the owner of the record.`
            }
        });
    }
};
