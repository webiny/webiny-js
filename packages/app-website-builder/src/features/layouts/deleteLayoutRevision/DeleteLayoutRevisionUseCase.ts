import { LayoutsRepository } from "../shared/abstractions.js";
import { DeleteLayoutRevisionUseCase as UseCaseAbstraction } from "./abstractions.js";

class DeleteLayoutRevisionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute(id: string) {
        return this.repository.deleteRevision(id);
    }
}

export const DeleteLayoutRevisionUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteLayoutRevisionUseCaseImpl,
    dependencies: [LayoutsRepository]
});
