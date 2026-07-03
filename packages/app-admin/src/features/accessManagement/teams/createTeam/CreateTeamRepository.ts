import type { Team } from "../../types.js";
import { TeamsListCache } from "../listTeams/abstractions.js";
import {
    CreateTeamRepository as RepositoryAbstraction,
    CreateTeamGateway,
    type ICreateTeamData
} from "./abstractions.js";

class CreateTeamRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: CreateTeamGateway.Interface,
        private cache: TeamsListCache.Interface
    ) {}

    async execute(data: ICreateTeamData): Promise<Team> {
        const team = await this.gateway.execute(data);
        this.cache.addItems([team]);
        return team;
    }
}

export const CreateTeamRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateTeamRepositoryImpl,
    dependencies: [CreateTeamGateway, TeamsListCache]
});
