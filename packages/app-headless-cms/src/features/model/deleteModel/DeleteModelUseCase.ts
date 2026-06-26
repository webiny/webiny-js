import { DeleteModelUseCase as UseCaseAbstraction, DeleteModelRepository } from "./abstractions.js";

class DeleteModelUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DeleteModelRepository.Interface) {}

    async execute(modelId: string, confirmation: string) {
        return this.repository.execute(modelId, confirmation);
    }
}

export const DeleteModelUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteModelUseCaseImpl,
    dependencies: [DeleteModelRepository]
});
