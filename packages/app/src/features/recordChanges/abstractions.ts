import { createAbstraction } from "@webiny/feature/admin";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { RecordChangedEvent } from "./RecordChangedEvent.js";

/**
 * Reacts to a record changed somewhere this tab did not see: by the assistant, a background task or
 * another tab. Every handler receives every change and filters on `event.payload.type`.
 */
export const RecordChangedEventHandler = createAbstraction<IEventHandler<RecordChangedEvent>>(
    "App/RecordChangedEventHandler"
);

export namespace RecordChangedEventHandler {
    export type Interface = IEventHandler<RecordChangedEvent>;
    export type Event = RecordChangedEvent;
}
