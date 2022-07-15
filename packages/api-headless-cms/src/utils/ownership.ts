import { BaseCmsSecurityPermission, CmsContext, CreatedBy } from "~/types";
import { NotAuthorizedError } from "@webiny/api-security";

interface OwnableRecord {
    createdBy?: CreatedBy;
    ownedBy?: CreatedBy;
}

export const checkOwnership = (
    context: CmsContext,
    permission: BaseCmsSecurityPermission,
    record: OwnableRecord
): void => {
    if (!permission.own) {
        return;
    }

    const identity = context.security.getIdentity();
    const owner = identity && record["ownedBy"] && record["ownedBy"].id === identity.id;
    const creator = identity && record["createdBy"] && record["createdBy"].id === identity.id;

    if (!owner && !creator) {
        throw new NotAuthorizedError({
            data: {
                reason: `You are not the owner of the record.`
            }
        });
    }
};

export const validateOwnership = (
    context: CmsContext,
    permission: BaseCmsSecurityPermission,
    record: OwnableRecord
): boolean => {
    try {
        checkOwnership(context, permission, record);
        return true;
    } catch {
        return false;
    }
};
