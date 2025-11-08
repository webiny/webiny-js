import type { Context } from "~/types.js";
import { NotAuthorizedError } from "~/utils/errors.js";

/**
 * Simple permission check. Only full access can access the websockets API via GraphQL - ({name: "*"})
 *
 * @throws
 */
export const checkPermissions = async (context: Pick<Context, "security">): Promise<void> => {
    const identity = context.security.getIdentity();
    if (!identity.id) {
        throw new NotAuthorizedError();
    }
};
