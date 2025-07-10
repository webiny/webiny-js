import type {
    ISearchPagesUseCase,
    SearchPagesUseCaseParams
} from "~/features/pages/loadPages/ISearchPagesUseCase.js";
import type { ILoadPagesRepository } from "~/features/pages/loadPages/ILoadPagesRepository.js";

export class SearchPagesUseCase implements ISearchPagesUseCase {
    private repository: ILoadPagesRepository;

    constructor(repository: ILoadPagesRepository) {
        this.repository = repository;
    }

    async execute(params: SearchPagesUseCaseParams) {
        let where = {};

        if (params.folderIds.length > 0) {
            where = {
                wbyAco_location: {
                    folderId_in: params.folderIds
                }
            };
        }

        await this.repository.searchPages(params.query, where);
    }
}
