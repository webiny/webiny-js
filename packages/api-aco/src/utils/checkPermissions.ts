import { NotAuthorizedError } from "@webiny/api-security";
import { SecurityIdentity } from "@webiny/api-security/types";

interface Params {
    security: {
        getIdentity: () => SecurityIdentity | null;
    };
}

export const checkPermissions = ({ security }: Params) => {
    const identity = security.getIdentity();
    if (!identity) {
        throw new NotAuthorizedError();
    }
};
