import { ListPagesUseCase as UseCaseAbstraction, ListPagesRepository } from "./abstractions.js";

class ListPagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListPagesRepository.Interface) {}

    execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        return this.repository.execute(params);
    }
}

export const ListPagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListPagesUseCaseImpl,
    dependencies: [ListPagesRepository]
});
