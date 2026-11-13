import { WebsocketEventHandler } from "@webiny/app/features/websocketEvents/index.js";
import { EventPublisher, type BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { ServerEntryChangedEvent } from "./ServerEntryChangedEvent.js";
import { ServerEntryDeletedEvent } from "./ServerEntryDeletedEvent.js";

// Sent by the api when the assistant changes an entry; see `NotifyEntryChangeUseCase` in
// @webiny/api-headless-cms.
const ENTRY_CREATED_ACTION = "cms.entry.created";
const ENTRY_UPDATED_ACTION = "cms.entry.updated";
const ENTRY_DELETED_ACTION = "cms.entry.deleted";

interface EntryMessageData {
    modelId: string;
    entryId: string;
}

const TO_EVENT = new Map<string, (data: EntryMessageData) => BaseEvent<EntryMessageData>>([
    [ENTRY_CREATED_ACTION, data => new ServerEntryChangedEvent(data)],
    [ENTRY_UPDATED_ACTION, data => new ServerEntryChangedEvent(data)],
    [ENTRY_DELETED_ACTION, data => new ServerEntryDeletedEvent(data)]
]);

/** Turns the api's entry messages into entry events. */
class EntryWebsocketMessagesImpl implements WebsocketEventHandler.Interface {
    constructor(private eventPublisher: EventPublisher.Interface) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        const toEvent = TO_EVENT.get(event.payload.action);
        if (!toEvent) {
            return;
        }

        const { data } = event.payload as unknown as { data: EntryMessageData };
        await this.eventPublisher.publish(
            toEvent({ modelId: data.modelId, entryId: data.entryId })
        );
    }
}

export const EntryWebsocketMessages = WebsocketEventHandler.createImplementation({
    implementation: EntryWebsocketMessagesImpl,
    dependencies: [EventPublisher]
});
