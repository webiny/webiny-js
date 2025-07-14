import type { IListPagesGateway } from "~/features/pages/loadPages/IListPagesGateway.js";
import { SortPagesUseCase } from "~/features/pages/loadPages/SortPagesUseCase.js";
import type { ISortPagesUseCase } from "~/features/pages/loadPages/ISortPagesUseCase.js";
import { listPagesRepositoryFactory } from "~/features/pages/loadPages/ListPagesRepositoryFactory.js";

export class SortPages {
    public static getInstance(gateway: IListPagesGateway): ISortPagesUseCase {
        const repository = listPagesRepositoryFactory.getRepository(gateway);
        return new SortPagesUseCase(repository);
    }
}
