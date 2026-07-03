import { BulkActionUseCase as UseCaseAbstraction, BulkActionRepository } from "./abstractions.js";
import type { IBulkActionParams } from "./abstractions.js";

class BulkActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: BulkActionRepository.Interface) {}

    async execute(params: IBulkActionParams) {
        return this.repository.execute(params);
    }
}

export const BulkActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: BulkActionUseCaseImpl,
    dependencies: [BulkActionRepository]
});
