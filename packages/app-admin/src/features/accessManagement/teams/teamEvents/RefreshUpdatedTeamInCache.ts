import { RefreshTeamInCacheRepository } from "./abstractions.js";
import { TeamUpdatedEventHandler } from "./abstractions.js";

/** Replaces the updated team in the teams list cache with what the server now has. */
class RefreshUpdatedTeamInCacheImpl implements TeamUpdatedEventHandler.Interface {
    constructor(private repository: RefreshTeamInCacheRepository.Interface) {}

    async handle(event: TeamUpdatedEventHandler.Event): Promise<void> {
        await this.repository.execute(event.payload.id);
    }
}

export const RefreshUpdatedTeamInCache = TeamUpdatedEventHandler.createImplementation({
    implementation: RefreshUpdatedTeamInCacheImpl,
    dependencies: [RefreshTeamInCacheRepository]
});
