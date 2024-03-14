import { BinRepository } from "./BinRepository";
import { IBinDeleteEntryGateway, IBinEntryMapper, IBinListGateway } from "~/abstractions";
import { BinListQueryVariables } from "~/types";

export class BinRepositoryFactory<
    TListParams extends BinListQueryVariables,
    TEntry extends Record<string, any>
> {
    private cache: Map<string, BinRepository<TListParams, TEntry>> = new Map();

    getRepository(
        listGateway: IBinListGateway<TListParams, TEntry>,
        deleteGateway: IBinDeleteEntryGateway,
        entryMapper: IBinEntryMapper<TEntry>,
        namespace: string
    ) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new BinRepository(listGateway, deleteGateway, entryMapper));
        }

        return this.cache.get(cacheKey) as BinRepository<TListParams, TEntry>;
    }

    private getCacheKey(namespace: string) {
        return [Date.now().toString(), namespace].join("#");
    }
}

export const binRepositoryFactory = new BinRepositoryFactory();
