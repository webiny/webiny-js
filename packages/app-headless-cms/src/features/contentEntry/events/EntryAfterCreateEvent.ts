import { EntryAfterCreateEventHandler } from "./abstractions.js";
import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface EntryAfterCreatePayload {
    entry: CmsContentEntry;
    model: CmsModel;
}

export class EntryAfterCreateEvent extends BaseEvent<EntryAfterCreatePayload> {
    readonly eventType = "Cms/Entry/AfterCreate" as const;

    getHandlerAbstraction() {
        return EntryAfterCreateEventHandler;
    }
}
