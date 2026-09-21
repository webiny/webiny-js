import { NotAuthorizedError } from "@webiny/api-security";
import { ApwContext } from "~/types";

export const ensureAuthentication = (context: ApwContext) => {
    const identity = context.security.getIdentity();
    if (!identity) {
        throw new NotAuthorizedError();
    }
};
