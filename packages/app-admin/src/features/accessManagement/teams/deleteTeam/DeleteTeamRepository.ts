import { TeamsListCache } from "../listTeams/abstractions.js";
import {
    DeleteTeamRepository as RepositoryAbstraction,
    DeleteTeamGateway
} from "./abstractions.js";

class DeleteTeamRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: DeleteTeamGateway.Interface,
        private cache: TeamsListCache.Interface
    ) {}

    async execute(id: string): Promise<void> {
        await this.gateway.execute(id);
        this.cache.removeItems(item => item.id === id);
    }
}

export const DeleteTeamRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteTeamRepositoryImpl,
    dependencies: [DeleteTeamGateway, TeamsListCache]
});
