import type { Team } from "../../types.js";
import { TeamsListCache } from "../listTeams/abstractions.js";
import {
    UpdateTeamRepository as RepositoryAbstraction,
    UpdateTeamGateway,
    type IUpdateTeamData
} from "./abstractions.js";

class UpdateTeamRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: UpdateTeamGateway.Interface,
        private cache: TeamsListCache.Interface
    ) {}

    async execute(id: string, data: IUpdateTeamData): Promise<Team> {
        const team = await this.gateway.execute(id, data);
        this.cache.updateItems(item => (item.id === team.id ? team : item));
        return team;
    }
}

export const UpdateTeamRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateTeamRepositoryImpl,
    dependencies: [UpdateTeamGateway, TeamsListCache]
});
