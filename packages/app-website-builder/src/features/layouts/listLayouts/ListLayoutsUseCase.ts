import { LayoutsRepository } from "../shared/abstractions.js";
import { ListLayoutsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListLayoutsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute() {
        return this.repository.list();
    }
}

export const ListLayoutsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListLayoutsUseCaseImpl,
    dependencies: [LayoutsRepository]
});
