import { Plugin, Context } from "@webiny/graphql/types";
import { SecurityPermission } from "@webiny/api-security/types";

export type PermissionsManagerMiddlewarePlugin = Plugin & {
    type: "permissions-manager-middleware";
    getPermissions(
        params: { identity: string | null; type: string },
        context: Context
    ): Promise<SecurityPermission[]>;
};
