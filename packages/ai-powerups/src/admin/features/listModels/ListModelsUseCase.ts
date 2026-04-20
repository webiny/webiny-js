import { ListModelsUseCase as UseCaseAbstraction, ListModelsRepository } from "./abstractions.js";

class ListModelsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListModelsRepository.Interface) {}

    async execute(): Promise<void> {
        return this.repository.execute();
    }
}

export const ListModelsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListModelsUseCaseImpl,
    dependencies: [ListModelsRepository]
});
