import { LayoutsRepository } from "../shared/abstractions.js";
import { UnpublishLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";

class UnpublishLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute(id: string) {
        return this.repository.unpublish(id);
    }
}

export const UnpublishLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: UnpublishLayoutUseCaseImpl,
    dependencies: [LayoutsRepository]
});
