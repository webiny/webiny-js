import { LayoutsRepository } from "../shared/abstractions.js";
import { GetLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute(id: string) {
        return this.repository.get(id);
    }
}

export const GetLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLayoutUseCaseImpl,
    dependencies: [LayoutsRepository]
});
