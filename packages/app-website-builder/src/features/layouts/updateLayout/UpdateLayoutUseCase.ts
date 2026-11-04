import { LayoutsRepository, type UpdateLayoutData } from "../shared/abstractions.js";
import { UpdateLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";

class UpdateLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute(id: string, data: UpdateLayoutData) {
        return this.repository.update(id, data);
    }
}

export const UpdateLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateLayoutUseCaseImpl,
    dependencies: [LayoutsRepository]
});
