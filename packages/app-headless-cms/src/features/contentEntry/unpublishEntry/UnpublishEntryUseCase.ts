import {
    UnpublishEntryUseCase as UseCaseAbstraction,
    UnpublishEntryRepository
} from "./abstractions.js";
import type { IUnpublishEntryParams } from "./abstractions.js";

class UnpublishEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UnpublishEntryRepository.Interface) {}

    async execute(params: IUnpublishEntryParams) {
        return this.repository.execute(params);
    }
}

export const UnpublishEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: UnpublishEntryUseCaseImpl,
    dependencies: [UnpublishEntryRepository]
});
