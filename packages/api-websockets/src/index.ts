import "./handler/register.js";
import type { Plugin } from "@webiny/plugins/types.js";
import { createWebsocketsContext } from "~/context/index.js";
import type { CreateWebsocketsContextParams } from "~/context/index.js";
import { createWebsocketsGraphQL } from "~/graphql/index.js";

export interface CreateWebsocketsParams extends CreateWebsocketsContextParams {}

/**
 * Optionally accepts a pre-built registry + transport pair. When omitted,
 * the legacy DDB-backed registry and API Gateway WebSocket transport are
 * used (existing serverless behavior). Container deployments supply the
 * pair from `@webiny/api-websockets-memory` (or another implementation).
 */
export const createWebsockets = (params: CreateWebsocketsParams = {}): Plugin[] => {
    return [createWebsocketsContext(params), createWebsocketsGraphQL()];
};

export * from "./validator/index.js";
export * from "./transport/index.js";
export * from "./runner/index.js";
export * from "./registry/index.js";
export * from "./context/index.js";

export * from "./plugins/index.js";
export type * from "./types.js";
