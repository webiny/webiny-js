import { NotAuthorizedError } from "@webiny/api-security";
import { SecurityIdentity } from "@webiny/api-security/types";
import { PbSecurityPermission } from "~/graphql/types";

export default (
    identity: SecurityIdentity,
    permission: PbSecurityPermission,
    entity: Record<string, any>,
    entityField = "createdBy"
): void => {
    // If user can only manage own records, let's check if he owns the loaded one.
    if (permission && permission.own === true) {
        if (entity[entityField].id !== identity.id) {
            throw new NotAuthorizedError();
        }
    }
};
