import { GetTeamGateway } from "../getTeam/abstractions.js";
import { TeamsListCache } from "../listTeams/abstractions.js";
import { TeamCreatedEventHandler } from "./abstractions.js";

/**
 * Reads the team back and adds it to the teams list cache, which the Teams view renders from.
 *
 * Read back rather than taken from the event, so the team has the same fields as one the admin loads
 * itself. `addItems` replaces by id, so an event for a team the list already has changes nothing.
 */
class AddCreatedTeamToCacheImpl implements TeamCreatedEventHandler.Interface {
    constructor(
        private getTeam: GetTeamGateway.Interface,
        private cache: TeamsListCache.Interface
    ) {}

    async handle(event: TeamCreatedEventHandler.Event): Promise<void> {
        const team = await this.getTeam.execute(event.payload.id);

        this.cache.addItems([team]);
    }
}

export const AddCreatedTeamToCache = TeamCreatedEventHandler.createImplementation({
    implementation: AddCreatedTeamToCacheImpl,
    dependencies: [GetTeamGateway, TeamsListCache]
});
