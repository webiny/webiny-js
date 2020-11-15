import { HandlerContext } from "@webiny/handler/types";
import { Plugin } from "@webiny/plugins/types";

export type SecurityUserManagementPlugin = Plugin & {
    name: "security-user-management";
    type: "security-user-management";
    // Executed each time a user logs in
    onLogin?: (params: { user; firstLogin: boolean }, context: HandlerContext) => Promise<void>;
    // Create user in a 3rd party identity provider
    createUser: (params: { data; user; permanent?: boolean }, context: HandlerContext) => Promise<void>;
    // Update user in a 3rd party identity provider
    updateUser: (params: { data; user }, context: HandlerContext) => Promise<void>;
    // Delete user from a 3rd party identity provider
    deleteUser: (params: { user }, context: HandlerContext) => Promise<void>;
};
