import type { Plugin } from "@webiny/plugins/types.js";
import { createWebsocketsGraphQL } from "~/graphql/index.js";

export const createWebsockets = (): Plugin[] => {
    return [createWebsocketsGraphQL()];
};

export { WebsocketsFeature } from "./features/feature.js";

export type * from "./validator/index.js";
export { WebsocketsTransport } from "./transport/index.js";
export * from "./runner/index.js";
export * from "./registry/index.js";

export * from "./plugins/index.js";
export type * from "./types.js";
