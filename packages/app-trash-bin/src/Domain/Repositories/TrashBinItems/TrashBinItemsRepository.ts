import { makeAutoObservable, runInAction } from "mobx";
import uniqBy from "lodash/uniqBy";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinItemMapper,
    ITrashBinListGateway,
    ITrashBinRestoreItemGateway,
    TrashBinItem
} from "@webiny/app-trash-bin-common";
import { IMetaRepository, Meta } from "@webiny/app-utils";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { ITrashBinItemsRepository } from "./ITrashBinItemsRepository";

export class TrashBinItemsRepository<TItem extends Record<string, any>>
    implements ITrashBinItemsRepository
{
    private metaRepository: IMetaRepository;
    private listGateway: ITrashBinListGateway<TItem>;
    private deleteGateway: ITrashBinDeleteItemGateway;
    private restoreGateway: ITrashBinRestoreItemGateway<TItem>;
    private itemMapper: ITrashBinItemMapper<TItem>;
    private items: TrashBinItem[] = [];
    private restoredItems: TrashBinItem[] = [];
    private params: TrashBinListQueryVariables = {};

    constructor(
        metaRepository: IMetaRepository,
        listGateway: ITrashBinListGateway<TItem>,
        deleteGateway: ITrashBinDeleteItemGateway,
        restoreGateway: ITrashBinRestoreItemGateway<TItem>,
        entryMapper: ITrashBinItemMapper<TItem>
    ) {
        this.metaRepository = metaRepository;
        this.listGateway = listGateway;
        this.deleteGateway = deleteGateway;
        this.restoreGateway = restoreGateway;
        this.itemMapper = entryMapper;
        this.params = {};
        makeAutoObservable(this);
    }

    getItems() {
        return this.items;
    }

    getRestoredItems() {
        return this.restoredItems;
    }

    getMeta() {
        return this.metaRepository.get();
    }

    getLoading() {
        return {};
    }

    async listItems(params?: TrashBinListQueryVariables) {
        this.params = params || {};

        const response = await this.listGateway.execute({ ...params });

        if (!response) {
            return;
        }

        runInAction(() => {
            const [items, meta] = response;
            this.items = items.map(entry => TrashBinItem.create(this.itemMapper.toDTO(entry)));
            this.metaRepository.set(Meta.create(meta));
        });
    }

    async listMoreItems() {
        const { cursor } = this.metaRepository.get();

        if (!cursor) {
            return;
        }

        const response = await this.listGateway.execute({ ...this.params, after: cursor });

        if (!response) {
            return;
        }

        runInAction(() => {
            const [items, meta] = response;
            const itemsDTO = items.map(entry => TrashBinItem.create(this.itemMapper.toDTO(entry)));
            this.items = uniqBy([...this.items, ...itemsDTO], "id");
            this.metaRepository.set(Meta.create(meta));
        });
    }

    async deleteItem(id: string) {
        const response = await this.deleteGateway.execute(id);

        if (!response) {
            return;
        }

        runInAction(() => {
            this.items = this.items.filter(item => item.id !== id);
            this.metaRepository.decreaseTotalCount(1);
        });
    }

    async restoreItem(id: string) {
        const item = await this.restoreGateway.execute(id);

        if (!item) {
            return;
        }

        runInAction(() => {
            this.items = this.items.filter(item => item.id !== id);
            this.restoredItems = [
                ...this.restoredItems,
                TrashBinItem.create(this.itemMapper.toDTO(item))
            ];
            this.metaRepository.decreaseTotalCount(1);
        });
    }
}
