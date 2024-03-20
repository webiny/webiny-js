import { makeAutoObservable, runInAction } from "mobx";
import uniqBy from "lodash/uniqBy";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinItemMapper,
    ITrashBinListGateway,
    TrashBinItem
} from "@webiny/app-trash-bin-common";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { ITrashBinItemsRepository } from "~/components/TrashBin/abstractions";

export class TrashBinItemsRepository<TItem extends Record<string, any>>
    implements ITrashBinItemsRepository
{
    private listGateway: ITrashBinListGateway<TItem>;
    private deleteGateway: ITrashBinDeleteItemGateway;
    private itemMapper: ITrashBinItemMapper<TItem>;
    private items: TrashBinItem[] = [];

    constructor(
        listGateway: ITrashBinListGateway<TItem>,
        deleteGateway: ITrashBinDeleteItemGateway,
        entryMapper: ITrashBinItemMapper<TItem>
    ) {
        this.listGateway = listGateway;
        this.deleteGateway = deleteGateway;
        this.itemMapper = entryMapper;
        makeAutoObservable(this);
    }

    async init(params = {}) {
        if (this.items.length > 0) {
            return;
        }

        const response = await this.listGateway.execute(params);

        if (!response) {
            return;
        }

        runInAction(() => {
            const [items] = response;
            this.items = items.map(item => TrashBinItem.create(this.itemMapper.toDTO(item)));
        });
    }

    getItems() {
        return this.items;
    }

    async listItems(override: boolean, params?: TrashBinListQueryVariables) {
        const executeParams = params || ({} as TrashBinListQueryVariables);
        const response = await this.listGateway.execute(executeParams);

        if (!response) {
            return;
        }

        runInAction(() => {
            const [items] = response;
            const itemsDTO = items.map(entry => TrashBinItem.create(this.itemMapper.toDTO(entry)));
            this.items = override ? itemsDTO : uniqBy([...this.items, ...itemsDTO], "id");
        });
    }

    async deleteItem(id: string) {
        const response = await this.deleteGateway.execute(id);

        if (response) {
            runInAction(() => {
                this.items = this.items.filter(item => item.id !== id);
            });
        }
    }
}
