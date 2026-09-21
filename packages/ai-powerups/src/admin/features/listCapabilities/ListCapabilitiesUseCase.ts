import {
    ListCapabilitiesUseCase as UseCaseAbstraction,
    ListCapabilitiesRepository
} from "./abstractions.js";

class ListCapabilitiesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListCapabilitiesRepository.Interface) {}

    async execute(): Promise<void> {
        return this.repository.execute();
    }
}

export const ListCapabilitiesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListCapabilitiesUseCaseImpl,
    dependencies: [ListCapabilitiesRepository]
});
