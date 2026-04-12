import { SearchPagesUseCase as UseCaseAbstraction, ListPagesRepository } from "./abstractions.js";

class SearchPagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListPagesRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        let where = {};
        if (params.folderIds.length > 0) {
            where = { location: { folderId_in: params.folderIds } };
        }
        await this.repository.searchPages(params.query, where);
    }
}

export const SearchPagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: SearchPagesUseCaseImpl,
    dependencies: [ListPagesRepository]
});
