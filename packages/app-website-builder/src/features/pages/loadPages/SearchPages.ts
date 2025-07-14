import type { IListPagesGateway } from "~/features/pages/loadPages/IListPagesGateway.js";
import type { ISearchPagesUseCase } from "~/features/pages/loadPages/ISearchPagesUseCase.js";
import { SearchPagesUseCase } from "~/features/pages/loadPages/SearchPagesUseCase.js";
import { listPagesRepositoryFactory } from "~/features/pages/loadPages/ListPagesRepositoryFactory.js";

export class SearchPages {
    public static getInstance(gateway: IListPagesGateway): ISearchPagesUseCase {
        const repository = listPagesRepositoryFactory.getRepository(gateway);
        return new SearchPagesUseCase(repository);
    }
}
