import { ISearchController, ISearchRepository } from "~/components/TrashBin/abstractions";

export class SearchController implements ISearchController {
    private repository: ISearchRepository;

    constructor(repository: ISearchRepository) {
        this.repository = repository;
    }

    async execute(query: string) {
        await this.repository.set(query);
    }
}
