import type { IListPagesGateway } from "~/features/pages/loadPages/IListPagesGateway.js";
import type { ILoadMorePagesUseCase } from "~/features/pages/loadPages/ILoadMorePagesUseCase.js";
import { LoadMorePagesUseCase } from "~/features/pages/loadPages/LoadMorePagesUseCase.js";
import { listPagesRepositoryFactory } from "~/features/pages/loadPages/ListPagesRepositoryFactory.js";

export class LoadMorePages {
    public static getInstance(gateway: IListPagesGateway): ILoadMorePagesUseCase {
        const repository = listPagesRepositoryFactory.getRepository(gateway);
        return new LoadMorePagesUseCase(repository);
    }
}
