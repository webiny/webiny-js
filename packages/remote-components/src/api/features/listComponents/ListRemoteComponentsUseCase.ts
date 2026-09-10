import {
    ListRemoteComponentsUseCase as UseCaseAbstraction,
    ListRemoteComponentsRepository
} from "./abstractions.js";

class ListRemoteComponentsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListRemoteComponentsRepository.Interface) {}

    async execute() {
        return this.repository.execute();
    }
}

export const ListRemoteComponentsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListRemoteComponentsUseCaseImpl,
    dependencies: [ListRemoteComponentsRepository]
});
