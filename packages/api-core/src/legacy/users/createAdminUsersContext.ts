import { ContextPlugin } from "@webiny/api";
import { LegacyContext } from "./LegacyContext.js";
import { createUsersGraphQL } from "~/graphql/users/user.gql.js";
import type { ApiCoreContext } from "~/types/core.js";

export const createAdminUsersContext = () => {
    return [
        new ContextPlugin<ApiCoreContext>(async context => {
            // Attach legacy context interface
            context.adminUsers = new LegacyContext(context.container);

            context.plugins.register(createUsersGraphQL());
        })
    ];
};
