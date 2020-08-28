import { ContextPlugin } from "@webiny/graphql/types";
import { PermissionsManagerClient } from "./PermissionsManagerClient";
import { SecurityAuthorizationPlugin } from "@webiny/api-security/types";

interface Params {
    functionName: string;
}

export default ({ functionName }: Params) => {
    return [
        {
            type: "context",
            name: "context-permission-manager",
            apply(context) {
                if (!context.security) {
                    context.security = {};
                }

                context.security.permissionsManager = new PermissionsManagerClient(
                    { functionName },
                    context
                );
            }
        } as ContextPlugin,
        {
            type: "security-authorization",
            getPermissions(context) {
                return context.security.permissionsManager.getPermissions();
            }
        } as SecurityAuthorizationPlugin
    ];
};
