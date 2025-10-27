import { ContextPlugin } from "@webiny/api";
import type { AdminUsersContext, AdminUsersStorageOperations } from "./types.js";
import baseGqlPlugins from "./graphql/base.gql.js";
import adminUsersGqlPlugins from "./graphql/user.gql.js";
import { AdminUsersFeature } from "~/features/AdminUsersFeature.js";

export interface Config {
    storageOperations: AdminUsersStorageOperations;
}

export default ({ storageOperations }: Config) => {
    return [
        new ContextPlugin<AdminUsersContext>(async context => {
            AdminUsersFeature.register(context.container, storageOperations);
            const teams = context.wcp.canUseTeams();
            context.plugins.register(adminUsersGqlPlugins({ teams }));
        }),
        baseGqlPlugins
    ];
};
