import type { WebsiteBuilderContext } from "~/context/types.js";
import { NotAuthorizedError } from "@webiny/api-headless-cms/utils/errors.js";

export const ensureAuthentication = (context: Pick<WebsiteBuilderContext, "security">) => {
    const identity = context.security.getIdentity();
    if (identity.isAnonymous()) {
        throw new NotAuthorizedError();
    }
};
