import {
    DuplicateEntryUseCase as UseCaseAbstraction,
    DuplicateEntryRepository
} from "./abstractions.js";
import type { IDuplicateEntryParams } from "./abstractions.js";

class DuplicateEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DuplicateEntryRepository.Interface) {}

    async execute(params: IDuplicateEntryParams) {
        return this.repository.execute(params);
    }
}

export const DuplicateEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: DuplicateEntryUseCaseImpl,
    dependencies: [DuplicateEntryRepository]
});
