import { NotAuthorizedError } from "@webiny/api-security";
import { Context, WebsocketsPermission } from "~/types";

/**
 * Simple permission check. Only full access can access the websockets API via GraphQL - ({name: "*"})
 *
 * @throws
 */
export const checkPermissions = async (context: Context): Promise<void> => {
    const permissions = await context.security.getPermissions<WebsocketsPermission>("websockets");

    if (permissions.length === 0) {
        throw new NotAuthorizedError();
    }
};
