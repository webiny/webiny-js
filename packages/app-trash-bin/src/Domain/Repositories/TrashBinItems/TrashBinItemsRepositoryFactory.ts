import { IMetaRepository } from "@webiny/app-utils";
import { ITrashBinItemMapper } from "~/Domain";
import {
    ITrashBinBulkActionsGateway,
    ITrashBinDeleteItemGateway,
    ITrashBinListGateway,
    ITrashBinRestoreItemGateway
} from "~/Gateways";
import { TrashBinItemsRepository } from "./TrashBinItemsRepository";

export class TrashBinItemsRepositoryFactory<TEntry extends Record<string, any>> {
    private cache: Map<string, TrashBinItemsRepository<TEntry>> = new Map();

    getRepository(
        metaRepository: IMetaRepository,
        listGateway: ITrashBinListGateway<TEntry>,
        deleteGateway: ITrashBinDeleteItemGateway,
        restoreGateway: ITrashBinRestoreItemGateway<TEntry>,
        bulkActionsGateway: ITrashBinBulkActionsGateway,
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
                    bulkActionsGateway,
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
