import { LayoutsRepository } from "../shared/abstractions.js";
import { CreateLayoutRevisionFromUseCase as UseCaseAbstraction } from "./abstractions.js";

class CreateLayoutRevisionFromUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute(id: string) {
        return this.repository.createRevisionFrom(id);
    }
}

export const CreateLayoutRevisionFromUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateLayoutRevisionFromUseCaseImpl,
    dependencies: [LayoutsRepository]
});
