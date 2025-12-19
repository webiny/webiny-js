import type {
    ISearchPagesUseCase,
    SearchPagesUseCaseParams
} from "~/features/pages/loadPages/ISearchPagesUseCase.js";
import type { IListPagesRepository } from "~/features/pages/loadPages/IListPagesRepository.js";

export class SearchPagesUseCase implements ISearchPagesUseCase {
    private repository: IListPagesRepository;

    constructor(repository: IListPagesRepository) {
        this.repository = repository;
    }

    async execute(params: SearchPagesUseCaseParams) {
        let where = {};

        if (params.folderIds.length > 0) {
            where = {
                location: {
                    folderId_in: params.folderIds
                }
            };
        }

        await this.repository.searchPages(params.query, where);
    }
}
