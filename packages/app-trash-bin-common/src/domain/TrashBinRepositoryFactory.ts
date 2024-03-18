import { TrashBinRepository } from "./TrashBinRepository";
import {
    ITrashBinDeleteEntryGateway,
    ITrashBinEntryMapper,
    ITrashBinListGateway
} from "~/abstractions";

export class TrashBinRepositoryFactory<TEntry extends Record<string, any>> {
    private cache: Map<string, TrashBinRepository<TEntry>> = new Map();

    getRepository(
        listGateway: ITrashBinListGateway<TEntry>,
        deleteGateway: ITrashBinDeleteEntryGateway,
        entryMapper: ITrashBinEntryMapper<TEntry>,
        namespace: string
    ) {
        const cacheKey = this.getCacheKey(namespace);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(
                cacheKey,
                new TrashBinRepository(listGateway, deleteGateway, entryMapper)
            );
        }

        return this.cache.get(cacheKey) as TrashBinRepository<TEntry>;
    }

    private getCacheKey(namespace: string) {
        return [Date.now().toString(), namespace].join("#");
    }
}

export const trashBinRepositoryFactory = new TrashBinRepositoryFactory();
