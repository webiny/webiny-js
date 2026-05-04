import {
    ListFilesUseCase as UseCaseAbstraction,
    ListFilesRepository,
    type ListFilesUseCaseParams,
    type ListFilesUseCaseResult
} from "./abstractions.js";

class ListFilesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListFilesRepository.Interface) {}

    async execute(params: ListFilesUseCaseParams): Promise<ListFilesUseCaseResult> {
        const result = await this.repository.execute({
            search: params.search,
            where: params.where,
            sort: params.sort,
            limit: params.limit,
            after: params.after
        });

        return {
            data: result.data,
            meta: result.meta
        };
    }
}

export const ListFilesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListFilesUseCaseImpl,
    dependencies: [ListFilesRepository]
});
