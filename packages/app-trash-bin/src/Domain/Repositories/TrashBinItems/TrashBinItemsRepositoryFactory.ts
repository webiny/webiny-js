import { TrashBinItemsRepository } from "./TrashBinItemsRepository";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinItemMapper,
    ITrashBinListGateway,
    ITrashBinRestoreItemGateway
} from "@webiny/app-trash-bin-common";
import { IMetaRepository } from "@webiny/app-utils";

export class TrashBinItemsRepositoryFactory<TEntry extends Record<string, any>> {
    private cache: Map<string, TrashBinItemsRepository<TEntry>> = new Map();

    getRepository(
        metaRepository: IMetaRepository,
        listGateway: ITrashBinListGateway<TEntry>,
        deleteGateway: ITrashBinDeleteItemGateway,
        restoreGateway: ITrashBinRestoreItemGateway<TEntry>,
        itemMapper: ITrashBinItemMapper<TEntry>
    ) {
        const cacheKey = this.getCacheKey();

        if (!this.cache.has(cacheKey)) {
            this.cache.set(
                cacheKey,
                new TrashBinItemsRepository(
                    metaRepository,
                    listGateway,
                    deleteGateway,
                    restoreGateway,
                    itemMapper
                )
            );
        }

        return this.cache.get(cacheKey) as TrashBinItemsRepository<TEntry>;
    }

    private getCacheKey() {
        return Date.now().toString();
    }
}

export const trashBinItemsRepositoryFactory = new TrashBinItemsRepositoryFactory();
