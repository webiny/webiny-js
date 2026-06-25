import type { Team } from "../../types.js";
import {
    CreateTeamUseCase as UseCaseAbstraction,
    CreateTeamRepository,
    type ICreateTeamData
} from "./abstractions.js";

class CreateTeamUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreateTeamRepository.Interface) {}

    async execute(data: ICreateTeamData): Promise<Team> {
        return this.repository.execute(data);
    }
}

export const CreateTeamUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateTeamUseCaseImpl,
    dependencies: [CreateTeamRepository]
});
