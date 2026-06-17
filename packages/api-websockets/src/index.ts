import type { Plugin } from "@webiny/plugins/types.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { WebsocketsFeature } from "./features/feature.js";
import { WebsocketsGraphQLFactoryFeature } from "./graphql/feature.js";

export const createWebsockets = (): Plugin[] => {
    const featurePlugin = createRegisterExtensionPlugin(context => {
        WebsocketsFeature.register(context.container);
        WebsocketsGraphQLFactoryFeature.register(context.container);
    });
    featurePlugin.name = "websockets.feature";
    return [featurePlugin];
};
