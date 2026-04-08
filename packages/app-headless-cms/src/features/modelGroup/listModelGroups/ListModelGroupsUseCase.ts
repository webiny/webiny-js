import {
    ListModelGroupsUseCase as UseCaseAbstraction,
    ListModelGroupsRepository
} from "./abstractions.js";

class ListModelGroupsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListModelGroupsRepository.Interface) {}

    async execute() {
        return this.repository.execute();
    }
}

export const ListModelGroupsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListModelGroupsUseCaseImpl,
    dependencies: [ListModelGroupsRepository]
});
