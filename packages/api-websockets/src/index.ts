import type { Plugin } from "@webiny/plugins/types.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createWebsocketsGraphQL } from "~/graphql/index.js";
import { WebsocketsFeature as Feature } from "./features/feature.js";

export const createWebsockets = (): Plugin[] => {
    const featurePlugin = createRegisterExtensionPlugin(context => {
        Feature.register(context.container);
    });
    featurePlugin.name = "websockets.feature";
    return [featurePlugin, createWebsocketsGraphQL()];
};

export { WebsocketsFeature } from "./features/feature.js";
export { ConnectionRegistry } from "./features/ConnectionRegistry/abstractions.js";

export type * from "./validator/index.js";
export { WebsocketsTransport } from "./transport/index.js";
export * from "./runner/index.js";
export * from "./registry/index.js";

export * from "./plugins/index.js";
export type * from "./types.js";
