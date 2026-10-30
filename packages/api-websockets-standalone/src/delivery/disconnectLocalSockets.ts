import type { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import type { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";
import type { WebsocketsServerAdapter } from "~/adapter/abstractions.js";

export interface IDisconnectLocalSocketsParams {
    connectionManager: WebsocketsConnectionManager.Interface<unknown>;
    adapter: WebsocketsServerAdapter.Interface<unknown>;
    logger: Logger.Interface;
    connectionIds: string[];
}

/*
 * Closes each socket this process holds, removes its connection, and returns the ids it holds no
 * socket for. A failed close is logged and the others go on.
 */
export const disconnectLocalSockets = async (
    params: IDisconnectLocalSocketsParams
): Promise<string[]> => {
    const { connectionManager, adapter, logger, connectionIds } = params;
    const missing: string[] = [];
    for (const connectionId of connectionIds) {
        const socket = connectionManager.getSocket(connectionId);
        if (socket === undefined) {
            missing.push(connectionId);
            continue;
        }
        try {
            adapter.close(socket);
            await connectionManager.remove(connectionId);
        } catch (error) {
            logger.error({ error, connectionId }, "[websockets] could not disconnect a connection");
        }
    }
    return missing;
};
