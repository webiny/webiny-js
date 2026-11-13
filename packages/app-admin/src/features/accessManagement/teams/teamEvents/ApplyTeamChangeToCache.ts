import { RecordChangedEventHandler } from "@webiny/app/features/recordChanges/index.js";
import { TeamsListCache } from "../listTeams/abstractions.js";
import { RefreshTeamInCacheRepository } from "./abstractions.js";

// Sent by the api for teams; see `TEAM_RECORD_TYPE` in @webiny/api-core.
const TEAM_RECORD_TYPE = "security.team";

/**
 * Keeps the teams list cache, which the Teams view renders from, in step with the server. A created
 * or updated team is read back into it; a deleted team cannot be read back, so it is taken out.
 */
class ApplyTeamChangeToCacheImpl implements RecordChangedEventHandler.Interface {
    constructor(
        private repository: RefreshTeamInCacheRepository.Interface,
        private cache: TeamsListCache.Interface
    ) {}

    async handle(event: RecordChangedEventHandler.Event): Promise<void> {
        const { type, id, change } = event.payload;
        if (type !== TEAM_RECORD_TYPE) {
            return;
        }

        if (change === "deleted") {
            this.cache.removeItems(team => team.id === id);
            return;
        }

        await this.repository.execute(id);
    }
}

export const ApplyTeamChangeToCache = RecordChangedEventHandler.createImplementation({
    implementation: ApplyTeamChangeToCacheImpl,
    dependencies: [RefreshTeamInCacheRepository, TeamsListCache]
});
