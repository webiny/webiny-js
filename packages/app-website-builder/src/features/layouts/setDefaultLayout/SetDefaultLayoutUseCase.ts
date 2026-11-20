import { LayoutsRepository } from "../shared/abstractions.js";
import { SetDefaultLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";

class SetDefaultLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute(entryId: string | null) {
        return this.repository.setDefaultLayout(entryId);
    }
}

export const SetDefaultLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: SetDefaultLayoutUseCaseImpl,
    dependencies: [LayoutsRepository]
});
