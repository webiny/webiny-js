import { GetTeamGateway } from "../getTeam/abstractions.js";
import { TeamsListCache } from "../listTeams/abstractions.js";
import { RefreshTeamInCacheRepository as RepositoryAbstraction } from "./abstractions.js";

/**
 * Read back rather than taken from the message, so the team has the same fields as one the admin loads
 * itself. A team the list already has is replaced where it is, so an update does not move its row; a
 * new one is added.
 */
class RefreshTeamInCacheRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: GetTeamGateway.Interface,
        private cache: TeamsListCache.Interface
    ) {}

    async execute(id: string): Promise<void> {
        const team = await this.gateway.execute(id);

        if (this.cache.getItem(item => item.id === id)) {
            this.cache.updateItems(item => (item.id === id ? team : item));
            return;
        }

        this.cache.addItems([team]);
    }
}

export const RefreshTeamInCacheRepository = RepositoryAbstraction.createImplementation({
    implementation: RefreshTeamInCacheRepositoryImpl,
    dependencies: [GetTeamGateway, TeamsListCache]
});
