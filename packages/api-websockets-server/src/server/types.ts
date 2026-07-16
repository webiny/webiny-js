import type { Server as HttpServer } from "node:http";
import type { PluginsContainer } from "@webiny/plugins";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";
import type { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";

/**
 * Resolves a connection's identity from the `?token` JWT sent on the WebSocket upgrade. This is the
 * SAME token→identity step the HTTP request stack runs (RequestIdentityLoader) — the handler wires it
 * to the root AuthenticationContext. Returns `null` for an absent/invalid/anonymous token, in which
 * case the connection registers anonymously and won't receive targeted (`SendToIdentity`) messages.
 */
export type WebsocketsConnectionAuthenticator = (
    token: string
) => Promise<ConnectionRegistry.Identity | null>;

interface BaseServerParams {
    plugins?: PluginsContainer | PluginCollection;
    heartbeatInterval?: number;
    debug?: boolean;
    connectionManager?: WebsocketsConnectionManager.Interface<unknown>;
    authenticate?: WebsocketsConnectionAuthenticator;
}

export interface CreateWebsocketsServerParams extends BaseServerParams {
    port?: number;
    host?: string;
}

export interface AttachWebsocketsServerParams extends BaseServerParams {
    server: HttpServer;
}

export interface IWebsocketsServer {
    start(): Promise<void>;
    stop(): Promise<void>;
    port(): number;
}
