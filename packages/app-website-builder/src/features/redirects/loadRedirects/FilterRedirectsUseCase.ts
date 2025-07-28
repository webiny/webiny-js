import type { IListRedirectsRepository } from "~/features/redirects/loadRedirects/IListRedirectsRepository.js";
import type {
    IFilterRedirectsUseCase,
    FilterRedirectsUseCaseParams
} from "~/features/redirects/loadRedirects/IFilterRedirectsUseCase.js";
import { ROOT_FOLDER } from "~/constants.js";

export class FilterRedirectsUseCase implements IFilterRedirectsUseCase {
    private repository: IListRedirectsRepository;

    constructor(repository: IListRedirectsRepository) {
        this.repository = repository;
    }

    async execute(params: FilterRedirectsUseCaseParams) {
        const cleanFilters = Object.fromEntries(
            Object.entries(params.filters).filter(([, value]) => value !== undefined)
        );

        // If the filters object is empty, we want to retrieve all documents in the folder.
        if (Object.values(cleanFilters).length === 0) {
            await this.repository.loadRedirects({
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

        await this.repository.filterRedirects(cleanFilters, where);
    }
}
