import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { ServerEntryChangedEventHandler } from "./abstractions.js";

export interface ServerEntryChangedPayload {
    modelId: string;
    entryId: string;
}

/** An entry was created or changed on the server, and the entries list may not have it yet. */
export class ServerEntryChangedEvent extends BaseEvent<ServerEntryChangedPayload> {
    readonly eventType = "Cms/ServerEntryChanged" as const;

    getHandlerAbstraction() {
        return ServerEntryChangedEventHandler;
    }
}
