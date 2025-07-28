import type { IListPagesRepository } from "~/features/pages/loadPages/IListPagesRepository.js";
import type {
    IFilterPagesUseCase,
    FilterPagesUseCaseParams
} from "~/features/pages/loadPages/IFilterPagesUseCase.js";
import { ROOT_FOLDER } from "~/constants.js";

export class FilterPagesUseCase implements IFilterPagesUseCase {
    private repository: IListPagesRepository;

    constructor(repository: IListPagesRepository) {
        this.repository = repository;
    }

    async execute(params: FilterPagesUseCaseParams) {
        const cleanFilters = Object.fromEntries(
            Object.entries(params.filters).filter(([, value]) => value !== undefined)
        );

        // If the filters object is empty, we want to retrieve all documents in the folder.
        if (Object.values(cleanFilters).length === 0) {
            await this.repository.loadPages({
                where: {
                    wbyAco_location: {
                        folderId: params.folderIds[0] ?? ROOT_FOLDER
                    }
                }
            });

            return;
        }

        let where = {};

        if (params.folderIds.length > 0) {
            where = {
                wbyAco_location: {
                    folderId_in: params.folderIds
                }
            };
        }

        await this.repository.filterPages(cleanFilters, where);
    }
}
