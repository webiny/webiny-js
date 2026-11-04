import { LayoutsRepository } from "../shared/abstractions.js";
import { DeleteLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";

class DeleteLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute(entryId: string) {
        return this.repository.delete(entryId);
    }
}

export const DeleteLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteLayoutUseCaseImpl,
    dependencies: [LayoutsRepository]
});
