import type { ILoadPagesUseCase } from "~/features/pages/loadPages/ILoadPagesUseCase.js";
import type { IListPagesGateway } from "~/features/pages/loadPages/IListPagesGateway.js";
import { LoadPagesUseCase } from "~/features/pages/loadPages/LoadPagesUseCase.js";
import { LoadPagesRepositoryFactory } from "~/features/pages/loadPages/LoadPagesRepositoryFactory.js";

export class LoadPages {
    public static getInstance(gateway: IListPagesGateway): ILoadPagesUseCase {
        const repository = new LoadPagesRepositoryFactory().getRepository(gateway);
        return new LoadPagesUseCase(repository);
    }
}
