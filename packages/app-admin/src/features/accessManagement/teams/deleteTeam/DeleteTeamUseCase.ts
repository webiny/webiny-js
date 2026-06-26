import { DeleteTeamUseCase as UseCaseAbstraction, DeleteTeamRepository } from "./abstractions.js";

class DeleteTeamUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DeleteTeamRepository.Interface) {}

    async execute(id: string): Promise<void> {
        return this.repository.execute(id);
    }
}

export const DeleteTeamUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteTeamUseCaseImpl,
    dependencies: [DeleteTeamRepository]
});
