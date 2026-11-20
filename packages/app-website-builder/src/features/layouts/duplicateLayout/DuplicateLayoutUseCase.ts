import { LayoutsRepository } from "../shared/abstractions.js";
import { DuplicateLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";

class DuplicateLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute(id: string) {
        return this.repository.duplicate(id);
    }
}

export const DuplicateLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: DuplicateLayoutUseCaseImpl,
    dependencies: [LayoutsRepository]
});
