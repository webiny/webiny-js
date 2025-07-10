import type { IListPagesGateway } from "~/features/pages/loadPages/IListPagesGateway.js";
import { SortPagesUseCase } from "~/features/pages/loadPages/SortPagesUseCase.js";
import type { ISortPagesUseCase } from "~/features/pages/loadPages/ISortPagesUseCase.js";
import { LoadPagesRepositoryFactory } from "~/features/pages/loadPages/LoadPagesRepositoryFactory.js";

export class SortPages {
    public static getInstance(gateway: IListPagesGateway): ISortPagesUseCase {
        const repository = new LoadPagesRepositoryFactory().getRepository(gateway);
        return new SortPagesUseCase(repository);
    }
}
