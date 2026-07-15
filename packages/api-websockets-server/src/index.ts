export { createWebsocketsServer, attachWebsocketsServer } from "~/server/WebsocketsServer.js";
export type { IWebsocketsServer } from "~/server/types.js";
export * from "~/adapter/abstractions.js";
export * from "~/upgradeHandler/abstractions.js";
export * from "~/connectionManager/abstractions.js";

// Concrete implementations, exported for custom DI wiring (e.g. splitting the shared connection
// manager + adapter into the root container and the transport into the per-request stack).
export { ServerConnectionManager } from "~/connectionManager/ServerConnectionManager.js";
export { NodeWsAdapter } from "~/adapter/NodeWsAdapter.js";
export { ServerWebsocketsTransport } from "~/transport/ServerWebsocketsTransport.js";
export { WebsocketsServerFeature } from "~/WebsocketsServerFeature.js";
