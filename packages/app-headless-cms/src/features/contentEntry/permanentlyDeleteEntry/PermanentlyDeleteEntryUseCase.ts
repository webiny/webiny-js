import {
    PermanentlyDeleteEntryUseCase as UseCaseAbstraction,
    PermanentlyDeleteEntryRepository
} from "./abstractions.js";
import type { IPermanentlyDeleteEntryParams } from "./abstractions.js";

class PermanentlyDeleteEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: PermanentlyDeleteEntryRepository.Interface) {}

    async execute(params: IPermanentlyDeleteEntryParams) {
        return this.repository.execute(params);
    }
}

export const PermanentlyDeleteEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: PermanentlyDeleteEntryUseCaseImpl,
    dependencies: [PermanentlyDeleteEntryRepository]
});
