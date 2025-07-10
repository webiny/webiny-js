import type { IListPagesGateway } from "~/features/pages/loadPages/IListPagesGateway.js";
import type { ILoadMorePagesUseCase } from "~/features/pages/loadPages/ILoadMorePagesUseCase.js";
import { LoadMorePagesUseCase } from "~/features/pages/loadPages/LoadMorePagesUseCase.js";
import { LoadPagesRepositoryFactory } from "~/features/pages/loadPages/LoadPagesRepositoryFactory.js";

export class LoadMorePages {
    public static getInstance(gateway: IListPagesGateway): ILoadMorePagesUseCase {
        const repository = new LoadPagesRepositoryFactory().getRepository(gateway);
        return new LoadMorePagesUseCase(repository);
    }
}
