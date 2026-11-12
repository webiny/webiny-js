import { WebsocketEventHandler } from "@webiny/app/features/websocketEvents/index.js";
import { EventPublisher, type BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { TeamCreatedEvent } from "./TeamCreatedEvent.js";
import { TeamUpdatedEvent } from "./TeamUpdatedEvent.js";
import { TeamDeletedEvent } from "./TeamDeletedEvent.js";

// Sent by the api when a team changes; see `NotifyTeamChangeUseCase` in @webiny/api-aco.
const TEAM_CREATED_ACTION = "security.team.created";
const TEAM_UPDATED_ACTION = "security.team.updated";
const TEAM_DELETED_ACTION = "security.team.deleted";

interface TeamMessageData {
    id: string;
}

const TO_EVENT = new Map<string, (id: string) => BaseEvent<{ id: string }>>([
    [TEAM_CREATED_ACTION, id => new TeamCreatedEvent({ id })],
    [TEAM_UPDATED_ACTION, id => new TeamUpdatedEvent({ id })],
    [TEAM_DELETED_ACTION, id => new TeamDeletedEvent({ id })]
]);

/** Turns the api's team messages into team events. */
class TeamWebsocketMessagesImpl implements WebsocketEventHandler.Interface {
    constructor(private eventPublisher: EventPublisher.Interface) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        const toEvent = TO_EVENT.get(event.payload.action);
        if (!toEvent) {
            return;
        }

        const { data } = event.payload as unknown as { data: TeamMessageData };
        await this.eventPublisher.publish(toEvent(data.id));
    }
}

export const TeamWebsocketMessages = WebsocketEventHandler.createImplementation({
    implementation: TeamWebsocketMessagesImpl,
    dependencies: [EventPublisher]
});
