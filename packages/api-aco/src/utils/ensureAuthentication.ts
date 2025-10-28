import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export const ensureAuthentication = (context: ApiCoreContext) => {
    const identity = context.security.getIdentity();
    if (!identity) {
        throw new NotAuthorizedError();
    }
};
