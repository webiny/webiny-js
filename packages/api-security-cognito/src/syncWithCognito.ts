import { ContextPlugin } from "@webiny/api";
import { type ICognitoConfig } from "./features/SyncWithCognito/index.js";
import { SyncWithCognitoFeature } from "~/features/SyncWithCognito/feature.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export const syncWithCognito = (config: ICognitoConfig) => {
    return new ContextPlugin<ApiCoreContext>(context => {
        SyncWithCognitoFeature.register(context.container, config);
    });
};
