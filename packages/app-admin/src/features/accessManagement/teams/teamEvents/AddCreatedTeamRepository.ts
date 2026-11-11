import { GetTeamGateway } from "../getTeam/abstractions.js";
import { TeamsListCache } from "../listTeams/abstractions.js";
import { AddCreatedTeamRepository as RepositoryAbstraction } from "./abstractions.js";

/**
 * Read back rather than taken from the message, so the team has the same fields as one the admin loads
 * itself. `addItems` replaces by id, so a team the list already has stays one row.
 */
class AddCreatedTeamRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: GetTeamGateway.Interface,
        private cache: TeamsListCache.Interface
    ) {}

    async execute(id: string): Promise<void> {
        const team = await this.gateway.execute(id);
        this.cache.addItems([team]);
    }
}

export const AddCreatedTeamRepository = RepositoryAbstraction.createImplementation({
    implementation: AddCreatedTeamRepositoryImpl,
    dependencies: [GetTeamGateway, TeamsListCache]
});
