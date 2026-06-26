import type { Team } from "../../types.js";
import { GetTeamRepository as RepositoryAbstraction, GetTeamGateway } from "./abstractions.js";

class GetTeamRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: GetTeamGateway.Interface) {}

    async execute(id: string): Promise<Team> {
        return this.gateway.execute(id);
    }
}

export const GetTeamRepository = RepositoryAbstraction.createImplementation({
    implementation: GetTeamRepositoryImpl,
    dependencies: [GetTeamGateway]
});
