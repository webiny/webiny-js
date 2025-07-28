import type {
    ISearchRedirectsUseCase,
    SearchRedirectsUseCaseParams
} from "~/features/redirects/loadRedirects/ISearchRedirectsUseCase.js";
import type { IListRedirectsRepository } from "~/features/redirects/loadRedirects/IListRedirectsRepository.js";

export class SearchRedirectsUseCase implements ISearchRedirectsUseCase {
    private repository: IListRedirectsRepository;

    constructor(repository: IListRedirectsRepository) {
        this.repository = repository;
    }

    async execute(params: SearchRedirectsUseCaseParams) {
        let where = {};

        if (params.folderIds.length > 0) {
            where = {
                wbyAco_location: {
                    folderId_in: params.folderIds
                }
            };
        }

        await this.repository.searchRedirects(params.query, where);
    }
}
