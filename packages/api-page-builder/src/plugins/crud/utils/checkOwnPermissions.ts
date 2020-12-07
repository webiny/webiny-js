import { NotAuthorizedError, SecurityIdentity } from "@webiny/api-security";

export default (
    identity: SecurityIdentity,
    permission: Record<string, any>,
    entity: Record<string, any>
): void => {
    // If user can only manage own records, let's check if he owns the loaded one.
    if (permission?.own === true) {
        if (entity.createdBy.id !== identity.id) {
            throw new NotAuthorizedError();
        }
    }
};
