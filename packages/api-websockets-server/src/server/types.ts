import type { Server as HttpServer } from "node:http";
import type { PluginsContainer } from "@webiny/plugins";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";
import type { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";

/**
 * Resolves a connection's identity from the `?token` JWT sent on the WebSocket upgrade — the SAME
 * token→identity step the HTTP request stack runs (RequestIdentityLoader). Returns `null` for an
 * absent/invalid/anonymous token, in which case the connection registers anonymously and won't
 * receive targeted (`SendToIdentity`) messages.
 *
 * It's a plain callback rather than a resolved dependency for two reasons: this WebSocket server is a
 * DI-agnostic class (the handler resolves what it needs and passes plain values in), and the auth it
 * needs — `AuthenticationContext` — lives in the PER-REQUEST stack, not the root container, so a
 * boot-time object like this couldn't resolve it directly anyway. The handler builds the callback
 * (spinning up a request-scoped child container per token). So authenticate has to be a callback the
 * handler supplies, regardless of DI.
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
