import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/index.js";
import { FolderCreatedEvent, type FolderCreatedPayload } from "./FolderCreatedEvent.js";

// Sent by the api when the assistant creates a folder; see `CreateFolderTool` in @webiny/api-aco.
const FOLDER_CREATED_ACTION = "aco.folder.created";

/**
 * Turns the folder messages the api sends over the websocket into folder events. The handlers that
 * update the cache listen to those events, so they never depend on how the news arrived.
 */
class FolderWebsocketMessagesImpl implements WebsocketEventHandler.Interface {
    constructor(private eventPublisher: EventPublisher.Interface) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        if (event.payload.action !== FOLDER_CREATED_ACTION) {
            return;
        }

        const { data } = event.payload as unknown as { data: FolderCreatedPayload };
        await this.eventPublisher.publish(new FolderCreatedEvent({ id: data.id }));
    }
}

export const FolderWebsocketMessages = WebsocketEventHandler.createImplementation({
    implementation: FolderWebsocketMessagesImpl,
    dependencies: [EventPublisher]
});
