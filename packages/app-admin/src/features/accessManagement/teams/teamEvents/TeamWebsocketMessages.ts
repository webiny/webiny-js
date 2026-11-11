import { WebsocketEventHandler } from "@webiny/app/features/websocketEvents/index.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/index.js";
import { TeamCreatedEvent } from "./TeamCreatedEvent.js";

// Sent by the api when a team is created; see `NotifyOnTeamCreatedHandler` in @webiny/api-aco.
const TEAM_CREATED_ACTION = "security.team.created";

interface TeamMessageData {
    id: string;
}

/** Turns the api's team message into `TeamCreatedEvent`. */
class TeamWebsocketMessagesImpl implements WebsocketEventHandler.Interface {
    constructor(private eventPublisher: EventPublisher.Interface) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        if (event.payload.action !== TEAM_CREATED_ACTION) {
            return;
        }

        const { data } = event.payload as unknown as { data: TeamMessageData };
        await this.eventPublisher.publish(new TeamCreatedEvent({ id: data.id }));
    }
}

export const TeamWebsocketMessages = WebsocketEventHandler.createImplementation({
    implementation: TeamWebsocketMessagesImpl,
    dependencies: [EventPublisher]
});
