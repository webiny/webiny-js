import { WebsocketEventHandler } from "@webiny/app/features/websocketEvents/index.js";
import { EventPublisher, type BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { UserCreatedEvent } from "./UserCreatedEvent.js";
import { UserUpdatedEvent } from "./UserUpdatedEvent.js";
import { UserDeletedEvent } from "./UserDeletedEvent.js";

// Sent by the api when an admin user changes; see `NotifyUserChangeUseCase` in @webiny/api-core.
const USER_CREATED_ACTION = "adminUsers.user.created";
const USER_UPDATED_ACTION = "adminUsers.user.updated";
const USER_DELETED_ACTION = "adminUsers.user.deleted";

interface UserMessageData {
    id: string;
}

const TO_EVENT = new Map<string, (id: string) => BaseEvent<{ id: string }>>([
    [USER_CREATED_ACTION, id => new UserCreatedEvent({ id })],
    [USER_UPDATED_ACTION, id => new UserUpdatedEvent({ id })],
    [USER_DELETED_ACTION, id => new UserDeletedEvent({ id })]
]);

/** Turns the api's admin user messages into user events. */
class UserWebsocketMessagesImpl implements WebsocketEventHandler.Interface {
    constructor(private eventPublisher: EventPublisher.Interface) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        const toEvent = TO_EVENT.get(event.payload.action);
        if (!toEvent) {
            return;
        }

        const { data } = event.payload as unknown as { data: UserMessageData };
        await this.eventPublisher.publish(toEvent(data.id));
    }
}

export const UserWebsocketMessages = WebsocketEventHandler.createImplementation({
    implementation: UserWebsocketMessagesImpl,
    dependencies: [EventPublisher]
});
