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

export * from "./validator/index.js";
export * from "./transport/index.js";
export * from "./runner/index.js";
export * from "./registry/index.js";
export * from "./features/ConnectionRegistry/abstractions.js";

export * from "./plugins/index.js";
export type * from "./types.js";
export { WebsocketsFeature } from "./WebsocketsFeature.js";
export { WebSocketLambdaHandler } from "./WebSocketLambdaHandler.js";
