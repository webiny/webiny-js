import { WebsocketEventHandler } from "@webiny/app/features/websocketEvents/index.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/index.js";
import type { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { RoleCreatedEvent } from "./RoleCreatedEvent.js";
import { RoleUpdatedEvent } from "./RoleUpdatedEvent.js";
import { RoleDeletedEvent } from "./RoleDeletedEvent.js";

// Sent by the api when a role changes; see `NotifyRoleChangeUseCase` in @webiny/api-aco.
const ROLE_CREATED_ACTION = "security.role.created";
const ROLE_UPDATED_ACTION = "security.role.updated";
const ROLE_DELETED_ACTION = "security.role.deleted";

interface RoleMessageData {
    id: string;
}

const TO_EVENT = new Map<string, (id: string) => BaseEvent<{ id: string }>>([
    [ROLE_CREATED_ACTION, id => new RoleCreatedEvent({ id })],
    [ROLE_UPDATED_ACTION, id => new RoleUpdatedEvent({ id })],
    [ROLE_DELETED_ACTION, id => new RoleDeletedEvent({ id })]
]);

/** Turns the api's role messages into role events. */
class RoleWebsocketMessagesImpl implements WebsocketEventHandler.Interface {
    constructor(private eventPublisher: EventPublisher.Interface) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        const toEvent = TO_EVENT.get(event.payload.action);
        if (!toEvent) {
            return;
        }

        const { data } = event.payload as unknown as { data: RoleMessageData };
        const roleEvent = toEvent(data.id);
        await this.eventPublisher.publish(roleEvent);
    }
}

export const RoleWebsocketMessages = WebsocketEventHandler.createImplementation({
    implementation: RoleWebsocketMessagesImpl,
    dependencies: [EventPublisher]
});
