import type { IListPagesGateway } from "~/features/pages/loadPages/IListPagesGateway.js";
import type { ISearchPagesUseCase } from "~/features/pages/loadPages/ISearchPagesUseCase.js";
import { SearchPagesUseCase } from "~/features/pages/loadPages/SearchPagesUseCase.js";
import { LoadPagesRepositoryFactory } from "~/features/pages/loadPages/LoadPagesRepositoryFactory.js";

export class SearchPages {
    public static getInstance(gateway: IListPagesGateway): ISearchPagesUseCase {
        const repository = new LoadPagesRepositoryFactory().getRepository(gateway);
        return new SearchPagesUseCase(repository);
    }
}
