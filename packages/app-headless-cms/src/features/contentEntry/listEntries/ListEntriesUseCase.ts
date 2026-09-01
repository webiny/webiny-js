import { ListEntriesUseCase as UseCaseAbstraction, ListEntriesRepository } from "./abstractions.js";
import type { IListEntriesUseCaseParams } from "./abstractions.js";

class ListEntriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListEntriesRepository.Interface) {}

    async execute(params: IListEntriesUseCaseParams) {
        return this.repository.execute(params);
    }
}

export const ListEntriesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListEntriesUseCaseImpl,
    dependencies: [ListEntriesRepository]
});
