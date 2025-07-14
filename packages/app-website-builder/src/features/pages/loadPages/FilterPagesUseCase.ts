import type { IListPagesRepository } from "~/features/pages/loadPages/IListPagesRepository.js";
import type {
    IFilterPagesUseCase,
    FilterPagesUseCaseParams
} from "~/features/pages/loadPages/IFilterPagesUseCase.js";

export class FilterPagesUseCase implements IFilterPagesUseCase {
    private repository: IListPagesRepository;

    constructor(repository: IListPagesRepository) {
        this.repository = repository;
    }

    async execute(params: FilterPagesUseCaseParams) {
        let where = {};

        if (params.folderIds.length > 0) {
            where = {
                wbyAco_location: {
                    folderId_in: params.folderIds
                }
            };
        }

        await this.repository.filterPages(params.filters, where);
    }
}
