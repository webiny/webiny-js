import { MoveEntryUseCase as UseCaseAbstraction, MoveEntryRepository } from "./abstractions.js";
import type { IMoveEntryParams } from "./abstractions.js";

class MoveEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: MoveEntryRepository.Interface) {}

    async execute(params: IMoveEntryParams) {
        return this.repository.execute(params);
    }
}

export const MoveEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: MoveEntryUseCaseImpl,
    dependencies: [MoveEntryRepository]
});
