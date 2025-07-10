import type { ILoadPagesUseCase } from "~/features/pages/loadPages/ILoadPagesUseCase.js";
import type { IListPagesGateway } from "~/features/pages/loadPages/IListPagesGateway.js";
import { LoadPagesUseCase } from "~/features/pages/loadPages/LoadPagesUseCase.js";
import { LoadPagesRepositoryFactory } from "~/features/pages/loadPages/LoadPagesRepositoryFactory.js";
import { Sorting } from "@webiny/app-utils";

export class LoadPages {
    public static getInstance(gateway: IListPagesGateway, sorting: Sorting[]): ILoadPagesUseCase {
        const repository = new LoadPagesRepositoryFactory().getRepository(gateway, sorting);
        return new LoadPagesUseCase(repository);
    }
}
