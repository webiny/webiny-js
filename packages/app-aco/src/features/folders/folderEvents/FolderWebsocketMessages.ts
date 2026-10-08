import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { EventPublisher, type BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { FolderCreatedEvent } from "./FolderCreatedEvent.js";
import { FolderUpdatedEvent } from "./FolderUpdatedEvent.js";
import { FolderDeletedEvent } from "./FolderDeletedEvent.js";

// Sent by the api when an AI tool changes a folder; see `NotifyFolderChangeUseCase` in @webiny/api-aco.
const FOLDER_CREATED_ACTION = "aco.folder.created";
const FOLDER_UPDATED_ACTION = "aco.folder.updated";
const FOLDER_DELETED_ACTION = "aco.folder.deleted";

interface FolderMessageData {
    id: string;
}

const TO_EVENT = new Map<string, (id: string) => BaseEvent<{ id: string }>>([
    [FOLDER_CREATED_ACTION, id => new FolderCreatedEvent({ id })],
    [FOLDER_UPDATED_ACTION, id => new FolderUpdatedEvent({ id })],
    [FOLDER_DELETED_ACTION, id => new FolderDeletedEvent({ id })]
]);

/**
 * Turns the folder messages the api sends over the websocket into folder events. The handlers that
 * update the cache listen to those events, so they never depend on how the news arrived.
 */
class FolderWebsocketMessagesImpl implements WebsocketEventHandler.Interface {
    constructor(private eventPublisher: EventPublisher.Interface) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        const toEvent = TO_EVENT.get(event.payload.action);
        if (!toEvent) {
            return;
        }

        const { data } = event.payload as unknown as { data: FolderMessageData };
        await this.eventPublisher.publish(toEvent(data.id));
    }
}

export const FolderWebsocketMessages = WebsocketEventHandler.createImplementation({
    implementation: FolderWebsocketMessagesImpl,
    dependencies: [EventPublisher]
});
