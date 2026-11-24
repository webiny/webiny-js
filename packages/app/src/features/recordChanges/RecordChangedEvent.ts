import { BaseEvent } from "~/features/eventPublisher/index.js";
import { RecordChangedEventHandler } from "./abstractions.js";

export type RecordChange = "created" | "updated" | "deleted";

export interface RecordChangedPayload {
    /** Names the kind of record, such as `security.team`. */
    type: string;
    id: string;
    /** For a record whose id only means something inside a parent, such as a CMS entry's model: the parent's id. */
    scope?: string;
    change: RecordChange;
}

/**
 * A record changed, and what the admin holds of it may be out of date.
 *
 * Says nothing about where the news came from. The websocket is the source today
 * (`RecordChangeMessages`); anything else can publish it and the handlers stay as they are.
 */
export class RecordChangedEvent extends BaseEvent<RecordChangedPayload> {
    readonly eventType = "App/RecordChanged" as const;

    getHandlerAbstraction() {
        return RecordChangedEventHandler;
    }
}
