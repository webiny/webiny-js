import type { Server as HttpServer } from "node:http";
import type { PluginsContainer } from "@webiny/plugins";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";

interface BaseServerParams {
    plugins?: PluginsContainer | PluginCollection;
    heartbeatInterval?: number;
    debug?: boolean;
    connectionManager?: WebsocketsConnectionManager.Interface<unknown>;
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
