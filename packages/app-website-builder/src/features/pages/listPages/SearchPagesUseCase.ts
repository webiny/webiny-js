import { IListPagesRepository } from "./IListPagesRepository.js";
import type { ISearchPagesUseCase } from "~/features/pages/listPages/ISearchPagesUseCase.js";

export class SearchPagesUseCase implements ISearchPagesUseCase {
    private repository: IListPagesRepository;

    constructor(repository: IListPagesRepository) {
        this.repository = repository;
    }

    async execute(query: string, folderIds: string[]) {
        let where = {};

        if (folderIds.length > 0) {
            where = {
                wbyAco_location: {
                    folderId_in: folderIds
                }
            };
        }

        await this.repository.execute({
            search: query,
            where
        });
    }
}
