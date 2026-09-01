import {
    ListPagesUseCase as UseCaseAbstraction,
    ListPagesRepository,
    type IListPagesUseCaseParams,
    type IListPagesUseCaseResult
} from "./abstractions.js";

class ListPagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListPagesRepository.Interface) {}

    async execute(params: IListPagesUseCaseParams): Promise<IListPagesUseCaseResult> {
        return this.repository.execute(params);
    }
}

export const ListPagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListPagesUseCaseImpl,
    dependencies: [ListPagesRepository]
});
