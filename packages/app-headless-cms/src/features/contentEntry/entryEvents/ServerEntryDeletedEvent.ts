import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { ServerEntryDeletedEventHandler } from "./abstractions.js";

export interface ServerEntryDeletedPayload {
    modelId: string;
    entryId: string;
}

/** An entry was deleted on the server, and the entries list may still hold it. */
export class ServerEntryDeletedEvent extends BaseEvent<ServerEntryDeletedPayload> {
    readonly eventType = "Cms/ServerEntryDeleted" as const;

    getHandlerAbstraction() {
        return ServerEntryDeletedEventHandler;
    }
}
