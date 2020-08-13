import { ContextPlugin } from "@webiny/graphql/types";
import { AccessManagerClient } from "./AccessManagerClient";

interface Params {
    functionName: string;
}

export default ({ functionName }: Params): ContextPlugin => {
    return {
        type: "context",
        name: "context-access-manager",
        apply(context) {
            if (!context.security) {
                context.security = {};
            }

            context.security.accessManager = new AccessManagerClient({ functionName }, context);

            // Override the default getPermissions() implementation.
            context.security.getPermissions = async () => {
                const identity = context.security.getIdentity();
                if (!identity) {
                    return [];
                }

                // If SecurityIdentity instance has its own `getPermissions` method, use it.
                if (typeof identity.getPermissions === "function") {
                    return await identity.getPermissions();
                }

                // If not, SecurityIdentity is relying on `context.security.getPermissions()` implementation.
                // When using api-security-user-management, we'll be loading permissions from a standalone
                // Lambda function which will process Groups/Roles, and return a normalized array of permissions.
                return await context.security.accessManager.getPermissions();
            };
        }
    };
};
