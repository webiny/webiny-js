import {
    DeleteModelGroupUseCase as UseCaseAbstraction,
    DeleteModelGroupRepository
} from "./abstractions.js";

class DeleteModelGroupUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DeleteModelGroupRepository.Interface) {}

    async execute(id: string) {
        await this.repository.execute(id);
    }
}

export const DeleteModelGroupUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteModelGroupUseCaseImpl,
    dependencies: [DeleteModelGroupRepository]
});
