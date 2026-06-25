import type { Team } from "../../types.js";
import { GetTeamUseCase as UseCaseAbstraction, GetTeamRepository } from "./abstractions.js";

class GetTeamUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetTeamRepository.Interface) {}

    async execute(id: string): Promise<Team> {
        return this.repository.execute(id);
    }
}

export const GetTeamUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetTeamUseCaseImpl,
    dependencies: [GetTeamRepository]
});
