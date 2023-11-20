import { NotAuthorizedError } from "@webiny/api-security";
import { AcoContext } from "~/types";

export const ensureAuthentication = (context: AcoContext) => {
    const identity = context.security.getIdentity();
    if (!identity) {
        throw new NotAuthorizedError();
    }
};
