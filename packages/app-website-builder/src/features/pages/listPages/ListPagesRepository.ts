import {
    ListPagesRepository as RepositoryAbstraction,
    ListPagesGateway,
    type IListPagesRepositoryParams,
    type IListPagesRepositoryResult
} from "./abstractions.js";
import { PageListCache } from "~/features/pages/shared/abstractions.js";

class ListPagesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: ListPagesGateway.Interface,
        private cache: PageListCache.Interface
    ) {}

    async execute(params: IListPagesRepositoryParams): Promise<IListPagesRepositoryResult> {
        const result = await this.gateway.execute(params);
        this.cache.addItems(result.data);
        return result;
    }
}

export const ListPagesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListPagesRepositoryImpl,
    dependencies: [ListPagesGateway, PageListCache]
});
