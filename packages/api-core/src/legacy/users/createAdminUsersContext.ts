import { ContextPlugin } from "@webiny/api";
import type { AdminUsersContext } from "~/types/users.js";
import { LegacyContext } from "./LegacyContext.js";
import { createUsersGraphQL } from "~/graphql/users/user.gql.js";

export interface AdminUsersContextConfig {
    teams: boolean;
}

export const createAdminUsersContext = ({ teams }: AdminUsersContextConfig) => {
    return [
        new ContextPlugin<AdminUsersContext>(async context => {
            // Attach legacy context interface
            context.adminUsers = new LegacyContext(context.container);

            context.plugins.register(createUsersGraphQL({ teams }));
        })
    ];
};
