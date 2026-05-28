import {
    ListTagsUseCase as UseCaseAbstraction,
    ListTagsRepository,
    type ListTagsUseCaseParams,
    type ListTagsUseCaseResult
} from "./abstractions.js";

class ListTagsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListTagsRepository.Interface) {}

    async execute(params: ListTagsUseCaseParams = {}): Promise<ListTagsUseCaseResult> {
        return this.repository.execute({
            where: params.where
        });
    }
}

export const ListTagsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListTagsUseCaseImpl,
    dependencies: [ListTagsRepository]
});
