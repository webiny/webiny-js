export { createServer } from "./createServer.js";
export { createHealthRoutePlugin } from "./plugins/HealthRoutePlugin.js";
export type { CreateServerParams, NodeServer } from "./types.js";

/**
 * Re-exports of the shared Fastify base — convenient single import surface
 * for container-mode entry files.
 */
export { ContextPlugin, createContextPlugin, type ContextPluginCallable } from "@webiny/handler";
export { RoutePlugin, createRoute } from "@webiny/handler";
