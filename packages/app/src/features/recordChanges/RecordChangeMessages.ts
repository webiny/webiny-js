import { WebsocketEventHandler } from "~/features/websocketEvents/index.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { RecordChangedEvent } from "./RecordChangedEvent.js";
import type { RecordChangedPayload } from "./RecordChangedEvent.js";

// Sent by the api when a record changes; see `NotifyRecordChangeUseCase` in @webiny/api-core.
const RECORD_CHANGED_ACTION = "record.changed";

/** Turns the api's record-changed messages into `RecordChangedEvent`s. */
class RecordChangeMessagesImpl implements WebsocketEventHandler.Interface {
    constructor(private eventPublisher: EventPublisher.Interface) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        if (event.payload.action !== RECORD_CHANGED_ACTION) {
            return;
        }

        const { data } = event.payload as unknown as { data: RecordChangedPayload };
        await this.eventPublisher.publish(new RecordChangedEvent(data));
    }
}

export const RecordChangeMessages = WebsocketEventHandler.createImplementation({
    implementation: RecordChangeMessagesImpl,
    dependencies: [EventPublisher]
});
