import { NotAuthorizedError, SecurityIdentity } from "@webiny/api-security";

export default (
    identity: SecurityIdentity,
    permission: Record<string, any>,
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
