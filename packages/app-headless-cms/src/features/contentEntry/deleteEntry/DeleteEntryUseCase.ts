import { DeleteEntryUseCase as UseCaseAbstraction, DeleteEntryRepository } from "./abstractions.js";
import type { IDeleteEntryParams } from "./abstractions.js";

class DeleteEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DeleteEntryRepository.Interface) {}

    async execute(params: IDeleteEntryParams) {
        return this.repository.execute(params);
    }
}

export const DeleteEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteEntryUseCaseImpl,
    dependencies: [DeleteEntryRepository]
});
