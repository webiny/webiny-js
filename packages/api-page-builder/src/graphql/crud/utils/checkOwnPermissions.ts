import { NotAuthorizedError } from "@webiny/api-security";
import { SecurityIdentity } from "@webiny/api-security/types";
import { PbSecurityPermission } from "~/graphql/types";

const FULL_ACCESS_NAMES = ["*", "pb.*"];

export default (
    identity: SecurityIdentity,
    permissions: PbSecurityPermission[],
    entity: Record<string, any>,
    entityField = "createdBy"
): void => {
    // First pass - check if we have full access to Page Builder.
    const hasFullAccess = permissions.some(p => FULL_ACCESS_NAMES.includes(p.name));
    if (hasFullAccess) {
        return;
    }

    // Second pass - if there's at least one permission that doesn't
    // prevent us from accessing non-owned records, then we grant access.
    const canAccessAllRecords = permissions.some(p => !p.own);
    if (canAccessAllRecords) {
        return;
    }

    // If we got here, that means we didn't encounter a permission object
    // that gives us the ability to access non-owned records.
    if (entity[entityField].id !== identity.id) {
        throw new NotAuthorizedError();
    }
};
