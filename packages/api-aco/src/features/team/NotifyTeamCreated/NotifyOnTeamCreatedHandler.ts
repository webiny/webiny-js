import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { TeamAfterCreateEventHandler } from "@webiny/api-core/features/security/teams/CreateTeam/index.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/exports/api.js";
import { TEAM_CREATED_WEBSOCKET_ACTION } from "./abstractions.js";

/*
 * Lives here rather than in api-core because api-core cannot depend on api-websockets, and api-aco is
 * where the `createTeam` tool is. A team the admin creates itself is announced too: the admin adds it
 * by id, so the tab that made it changes nothing and the user's other tabs pick it up.
 */
class NotifyOnTeamCreatedHandlerImpl implements TeamAfterCreateEventHandler.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async handle(event: TeamAfterCreateEventHandler.Event): Promise<void> {
        const recipient = this.identityContext.getIdentity()?.id;
        if (!recipient) {
            return;
        }

        try {
            await this.sendToIdentity.execute(
                { id: recipient },
                { action: TEAM_CREATED_WEBSOCKET_ACTION, data: { id: event.payload.team.id } }
            );
        } catch {
            // The team exists either way; the admin lists it on its next reload.
        }
    }
}

export const NotifyOnTeamCreatedHandler = TeamAfterCreateEventHandler.createImplementation({
    implementation: NotifyOnTeamCreatedHandlerImpl,
    dependencies: [IdentityContext, WebsocketsSendToIdentityUseCase]
});
