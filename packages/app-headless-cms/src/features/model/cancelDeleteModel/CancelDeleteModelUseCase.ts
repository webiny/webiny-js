import {
    CancelDeleteModelUseCase as UseCaseAbstraction,
    CancelDeleteModelRepository
} from "./abstractions.js";

class CancelDeleteModelUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CancelDeleteModelRepository.Interface) {}

    async execute(modelId: string) {
        return this.repository.execute(modelId);
    }
}

export const CancelDeleteModelUseCase = UseCaseAbstraction.createImplementation({
    implementation: CancelDeleteModelUseCaseImpl,
    dependencies: [CancelDeleteModelRepository]
});
