import { Plugin } from "@webiny/graphql/types";
import { Context } from "@webiny/graphql/types";

export type SecurityUserManagementPlugin = Plugin & {
    name: "security-user-management";
    type: "security-user-management";
    // Executed each time a user logs in
    onLogin?: (params: { user; firstLogin: boolean }, context: Context) => Promise<void>;
    // Create user in a 3rd party identity provider
    createUser: (params: { data; user; permanent?: boolean }, context: Context) => Promise<void>;
    // Update user in a 3rd party identity provider
    updateUser: (params: { data; user }, context: Context) => Promise<void>;
    // Delete user from a 3rd party identity provider
    deleteUser: (params: { user }, context: Context) => Promise<void>;
};
