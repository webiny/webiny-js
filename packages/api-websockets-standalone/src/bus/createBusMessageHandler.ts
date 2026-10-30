import type { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import type { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";
import type { WebsocketsServerAdapter } from "~/adapter/abstractions.js";
import type { WebsocketsMessageBus } from "./abstractions.js";
import { sendToLocalSockets } from "~/delivery/sendToLocalSockets.js";
import { disconnectLocalSockets } from "~/delivery/disconnectLocalSockets.js";

export interface ICreateBusMessageHandlerParams {
    connectionManager: WebsocketsConnectionManager.Interface<unknown>;
    adapter: WebsocketsServerAdapter.Interface<unknown>;
    logger: Logger.Interface;
}

/*
 * Handles what other processes publish to this one: sends and disconnects for sockets this process
 * holds. Messages arrive here only for connections this process owns, so one with no socket left is
 * gone, and its connection is removed.
 */
export const createBusMessageHandler = (
    params: ICreateBusMessageHandlerParams
): WebsocketsMessageBus.Handler => {
    const { connectionManager } = params;
    return async message => {
        let missing: string[];
        if (message.action === "send") {
            missing = await sendToLocalSockets({
                ...params,
                connectionIds: message.connectionIds,
                data: message.data
            });
        } else {
            missing = await disconnectLocalSockets({
                ...params,
                connectionIds: message.connectionIds
            });
        }
        for (const connectionId of missing) {
            await connectionManager.remove(connectionId);
        }
    };
};
