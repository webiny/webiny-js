import {
    ListDeletedEntriesUseCase as UseCaseAbstraction,
    ListDeletedEntriesRepository
} from "./abstractions.js";
import type { IListDeletedEntriesParams } from "./abstractions.js";

class ListDeletedEntriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListDeletedEntriesRepository.Interface) {}

    async execute(params: IListDeletedEntriesParams) {
        return this.repository.execute(params);
    }
}

export const ListDeletedEntriesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListDeletedEntriesUseCaseImpl,
    dependencies: [ListDeletedEntriesRepository]
});
