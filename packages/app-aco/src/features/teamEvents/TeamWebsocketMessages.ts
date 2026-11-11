import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/index.js";
import { TeamCreatedEvent } from "@webiny/app-admin/features/accessManagement/teams/teamEvents/index.js";

// Sent by the api when a team is created; see `NotifyOnTeamCreatedHandler` in @webiny/api-aco.
const TEAM_CREATED_ACTION = "security.team.created";

interface TeamMessageData {
    id: string;
}

/**
 * Turns the api's team message into the admin's `TeamCreatedEvent`.
 *
 * Here rather than in @webiny/app-admin, which owns the teams list, because @webiny/app-websockets
 * depends on app-admin and app-admin cannot depend back on it. @webiny/api-aco sends the message, so
 * this package reads it.
 */
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
