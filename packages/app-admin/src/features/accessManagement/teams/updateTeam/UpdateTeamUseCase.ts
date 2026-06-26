import type { Team } from "../../types.js";
import {
    UpdateTeamUseCase as UseCaseAbstraction,
    UpdateTeamRepository,
    type IUpdateTeamData
} from "./abstractions.js";

class UpdateTeamUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateTeamRepository.Interface) {}

    async execute(id: string, data: IUpdateTeamData): Promise<Team> {
        return this.repository.execute(id, data);
    }
}

export const UpdateTeamUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateTeamUseCaseImpl,
    dependencies: [UpdateTeamRepository]
});
