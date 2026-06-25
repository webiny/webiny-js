import { UpdateEntryUseCase as UseCaseAbstraction, UpdateEntryRepository } from "./abstractions.js";
import type { IUpdateEntryParams } from "./abstractions.js";

class UpdateEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateEntryRepository.Interface) {}

    async execute(params: IUpdateEntryParams) {
        return this.repository.execute(params);
    }
}

export const UpdateEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateEntryUseCaseImpl,
    dependencies: [UpdateEntryRepository]
});
