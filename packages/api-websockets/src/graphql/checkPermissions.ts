import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";
import type { Context, WebsocketsPermission } from "~/types.js";

/**
 * Simple permission check. Only full access can access the websockets API via GraphQL - ({name: "*"})
 *
 * @throws
 */
export const checkPermissions = async (context: Context): Promise<void> => {
    const identityContext = context.container.resolve(IdentityContext);
    const permissions = await identityContext.getPermissions<WebsocketsPermission>("websockets");

    if (permissions.length === 0) {
        throw new NotAuthorizedError();
    }
};
