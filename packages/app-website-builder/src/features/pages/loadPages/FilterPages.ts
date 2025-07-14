import type { IListPagesGateway } from "~/features/pages/loadPages/IListPagesGateway.js";
import { ListPagesRepositoryFactory } from "~/features/pages/loadPages/ListPagesRepositoryFactory.js";
import { FilterPagesUseCase } from "~/features/pages/loadPages/FilterPagesUseCase.js";
import type { IFilterPagesUseCase } from "~/features/pages/loadPages/IFilterPagesUseCase.js";

export class FilterPages {
    public static getInstance(gateway: IListPagesGateway): IFilterPagesUseCase {
        const repository = new ListPagesRepositoryFactory().getRepository(gateway);
        return new FilterPagesUseCase(repository);
    }
}
