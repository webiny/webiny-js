import type { GenericRecord } from "@webiny/api/types.js";
import type { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import type { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";
import type { WebsocketsServerAdapter } from "~/adapter/abstractions.js";

export interface ISendToLocalSocketsParams {
    connectionManager: WebsocketsConnectionManager.Interface<unknown>;
    adapter: WebsocketsServerAdapter.Interface<unknown>;
    logger: Logger.Interface;
    connectionIds: string[];
    data: GenericRecord;
}

/*
 * Sends `data` on each socket this process holds and returns the ids it holds no socket for. A failed
 * send is logged and the others go on.
 */
export const sendToLocalSockets = async (params: ISendToLocalSocketsParams): Promise<string[]> => {
    const { connectionManager, adapter, logger, connectionIds, data } = params;
    const payload = JSON.stringify(data);
    const missing: string[] = [];
    for (const connectionId of connectionIds) {
        const socket = connectionManager.getSocket(connectionId);
        if (socket === undefined) {
            missing.push(connectionId);
            continue;
        }
        try {
            await adapter.send(socket, payload);
        } catch (error) {
            logger.error({ error, connectionId }, "[websockets] could not send to a connection");
        }
    }
    return missing;
};
