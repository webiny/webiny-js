import { EntryAfterDeleteEventHandler } from "./abstractions.js";
import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import type { CmsModel } from "~/types.js";

export interface EntryAfterDeletePayload {
    model: CmsModel;
    id: string;
    entryId: string;
}

export class EntryAfterDeleteEvent extends BaseEvent<EntryAfterDeletePayload> {
    readonly eventType = "Cms/Entry/AfterDelete" as const;

    getHandlerAbstraction() {
        return EntryAfterDeleteEventHandler;
    }
}
