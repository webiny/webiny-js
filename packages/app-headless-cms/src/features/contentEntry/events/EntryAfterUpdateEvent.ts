import { EntryAfterUpdateEventHandler } from "./abstractions.js";
import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface EntryAfterUpdatePayload {
    entry: CmsContentEntry;
    model: CmsModel;
}

export class EntryAfterUpdateEvent extends BaseEvent<EntryAfterUpdatePayload> {
    readonly eventType = "Cms/Entry/AfterUpdate" as const;

    getHandlerAbstraction() {
        return EntryAfterUpdateEventHandler;
    }
}
