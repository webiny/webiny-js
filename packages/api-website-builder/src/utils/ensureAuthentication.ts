import { NotAuthorizedError } from "@webiny/api-security";
import type { WebsiteBuilderContext } from "~/types";

export const ensureAuthentication = (context: WebsiteBuilderContext) => {
    const identity = context.security.getIdentity();
    if (!identity) {
        throw new NotAuthorizedError();
    }
};
