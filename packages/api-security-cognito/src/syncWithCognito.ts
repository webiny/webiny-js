import { ContextPlugin } from "@webiny/api";
import type { AdminUsersContext } from "@webiny/api-admin-users/types.js";
import { type ICognitoConfig } from "./features/SyncWithCognito/index.js";
import { SyncWithCognitoFeature } from "~/features/SyncWithCognito/feature.js";

export const syncWithCognito = (config: ICognitoConfig) => {
    return new ContextPlugin<AdminUsersContext>(context => {
        SyncWithCognitoFeature.register(context.container, config);
    });
};
