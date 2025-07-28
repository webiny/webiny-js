import { NotAuthorizedError } from "@webiny/api-security";
import { WebsiteBuilderContext } from "~/context/types";

export const ensureAuthentication = (context: Pick<WebsiteBuilderContext, "security">) => {
    const identity = context.security.getIdentity();
    if (!identity) {
        throw new NotAuthorizedError();
    }
};
