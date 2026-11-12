import { TeamsListCache } from "../listTeams/abstractions.js";
import { TeamDeletedEventHandler } from "./abstractions.js";

/** Takes the deleted team out of the teams list cache. A deleted team cannot be read back. */
class RemoveDeletedTeamFromCacheImpl implements TeamDeletedEventHandler.Interface {
    constructor(private cache: TeamsListCache.Interface) {}

    async handle(event: TeamDeletedEventHandler.Event): Promise<void> {
        const { id } = event.payload;
        this.cache.removeItems(team => team.id === id);
    }
}

export const RemoveDeletedTeamFromCache = TeamDeletedEventHandler.createImplementation({
    implementation: RemoveDeletedTeamFromCacheImpl,
    dependencies: [TeamsListCache]
});
