import type { ILoadPagesUseCase } from "~/features/pages/loadPages/ILoadPagesUseCase.js";
import type { IListPagesGateway } from "~/features/pages/loadPages/IListPagesGateway.js";
import { LoadPagesUseCase } from "~/features/pages/loadPages/LoadPagesUseCase.js";
import { listPagesRepositoryFactory } from "~/features/pages/loadPages/ListPagesRepositoryFactory.js";

export class LoadPages {
    public static getInstance(gateway: IListPagesGateway): ILoadPagesUseCase {
        const repository = listPagesRepositoryFactory.getRepository(gateway);
        return new LoadPagesUseCase(repository);
    }
}
