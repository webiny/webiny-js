import { createAbstraction } from "@webiny/feature/api";
import type { InputHandler } from "@webiny/api-kernel-core";
import type { ConnectionRegistry } from "@webiny/api-websockets/features/ConnectionRegistry/abstractions.js";

export const WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER = "WebinyWebsocketsConnectionRows";

/** One write to the connection registry's rows. */
export type WebsocketsConnectionRowWrite =
    | { action: "register"; connection: ConnectionRegistry.RegisterParams }
    | { action: "unregister"; connectionId: string }
    | { action: "updateLastSeen"; connectionId: string };

/** Why a row write failed. */
export interface WebsocketsConnectionRowWriteFailure {
    message: string;
    code?: string;
}

/** What to do with the connection registry's rows. */
export type WebsocketsConnectionRowsChange =
    /**
     * Applies the writes in order, in one request. Answers, per write, `null` when it was applied,
     * or why it failed: one failed write does not stop the others.
     */
    | { action: "write"; writes: WebsocketsConnectionRowWrite[] }
    /**
     * Removes the rows of every connection not seen since `olderThan` (an ISO date), in one
     * request, and answers the ids of the rows it removed. A row it couldn't remove stays, and the
     * next sweep tries again.
     */
    | { action: "removeStale"; olderThan: string };

/** `write` answers a failure (or `null`) per write; `removeStale` answers the removed ids. */
export type WebsocketsConnectionRowsResult =
    | (WebsocketsConnectionRowWriteFailure | null)[]
    | string[];

/**
 * A change to the websocket connections' rows, from outside any request: sockets that connect,
 * send or close, and the sweep of stale connections. The rows are a storage, which lives in a
 * request's container, so the server's websocket code dispatches this and it runs in a fresh one.
 */
export type IWebsocketsConnectionRowsEvent = {
    [WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER]: true;
} & WebsocketsConnectionRowsChange;

export interface IWebsocketsConnectionRowsInputHandler extends InputHandler.Interface<
    IWebsocketsConnectionRowsEvent,
    WebsocketsConnectionRowsResult
> {}

export const WebsocketsConnectionRowsInputHandler =
    createAbstraction<IWebsocketsConnectionRowsInputHandler>(
        "Websockets/ConnectionRowsEventHandler"
    );

export namespace WebsocketsConnectionRowsInputHandler {
    export type Interface = IWebsocketsConnectionRowsInputHandler;
}
