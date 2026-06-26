import {
    DeleteEntryRevisionUseCase as UseCaseAbstraction,
    DeleteEntryRevisionRepository
} from "./abstractions.js";
import type { IDeleteEntryRevisionParams } from "./abstractions.js";

class DeleteEntryRevisionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DeleteEntryRevisionRepository.Interface) {}

    async execute(params: IDeleteEntryRevisionParams) {
        return this.repository.execute(params);
    }
}

export const DeleteEntryRevisionUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteEntryRevisionUseCaseImpl,
    dependencies: [DeleteEntryRevisionRepository]
});
