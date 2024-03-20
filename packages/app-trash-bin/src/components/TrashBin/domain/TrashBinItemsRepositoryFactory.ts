import { TrashBinItemsRepository } from "./TrashBinItemsRepository";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinItemMapper,
    ITrashBinListGateway
} from "@webiny/app-trash-bin-common";

export class TrashBinItemsRepositoryFactory<TEntry extends Record<string, any>> {
    private cache: Map<string, TrashBinItemsRepository<TEntry>> = new Map();

    getRepository(
        listGateway: ITrashBinListGateway<TEntry>,
        deleteGateway: ITrashBinDeleteItemGateway,
        itemMapper: ITrashBinItemMapper<TEntry>
    ) {
        const cacheKey = this.getCacheKey();

        if (!this.cache.has(cacheKey)) {
            this.cache.set(
                cacheKey,
                new TrashBinItemsRepository(listGateway, deleteGateway, itemMapper)
            );
        }

        return this.cache.get(cacheKey) as TrashBinItemsRepository<TEntry>;
    }

    private getCacheKey() {
        return Date.now().toString();
    }
}

export const trashBinItemsRepositoryFactory = new TrashBinItemsRepositoryFactory();
