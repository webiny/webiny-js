import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/index.js";
import { FolderCreatedEvent } from "./FolderCreatedEvent.js";
import { FolderUpdatedEvent } from "./FolderUpdatedEvent.js";

// Sent by the api when an AI tool changes a folder; see `NotifyFolderChangeUseCase` in @webiny/api-aco.
const FOLDER_CREATED_ACTION = "aco.folder.created";
const FOLDER_UPDATED_ACTION = "aco.folder.updated";

interface FolderMessageData {
    id: string;
}

/**
 * Turns the folder messages the api sends over the websocket into folder events. The handlers that
 * update the cache listen to those events, so they never depend on how the news arrived.
 */
class FolderWebsocketMessagesImpl implements WebsocketEventHandler.Interface {
    constructor(private eventPublisher: EventPublisher.Interface) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        const { action } = event.payload;
        if (action !== FOLDER_CREATED_ACTION && action !== FOLDER_UPDATED_ACTION) {
            return;
        }

        const { data } = event.payload as unknown as { data: FolderMessageData };

        if (action === FOLDER_CREATED_ACTION) {
            await this.eventPublisher.publish(new FolderCreatedEvent({ id: data.id }));
            return;
        }

        await this.eventPublisher.publish(new FolderUpdatedEvent({ id: data.id }));
    }
}

export const FolderWebsocketMessages = WebsocketEventHandler.createImplementation({
    implementation: FolderWebsocketMessagesImpl,
    dependencies: [EventPublisher]
});
