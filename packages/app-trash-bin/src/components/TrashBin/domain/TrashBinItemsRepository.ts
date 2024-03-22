import { makeAutoObservable, runInAction } from "mobx";
import uniqBy from "lodash/uniqBy";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinItemMapper,
    ITrashBinListGateway,
    TrashBinItem
} from "@webiny/app-trash-bin-common";
import { IMetaRepository, Meta } from "@webiny/app-utils";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { ITrashBinItemsRepository } from "~/components/TrashBin/abstractions";

export class TrashBinItemsRepository<TItem extends Record<string, any>>
    implements ITrashBinItemsRepository
{
    private metaRepository: IMetaRepository;
    private listGateway: ITrashBinListGateway<TItem>;
    private deleteGateway: ITrashBinDeleteItemGateway;
    private itemMapper: ITrashBinItemMapper<TItem>;
    private items: TrashBinItem[] = [];

    constructor(
        metaRepository: IMetaRepository,
        listGateway: ITrashBinListGateway<TItem>,
        deleteGateway: ITrashBinDeleteItemGateway,
        entryMapper: ITrashBinItemMapper<TItem>
    ) {
        this.metaRepository = metaRepository;
        this.listGateway = listGateway;
        this.deleteGateway = deleteGateway;
        this.itemMapper = entryMapper;
        makeAutoObservable(this);
    }

    async init(params = {}) {
        if (this.items.length > 0) {
            return;
        }

        await this.metaRepository.init();

        const response = await this.listGateway.execute(params);

        if (!response) {
            return;
        }

        runInAction(() => {
            const [items, meta] = response;
            this.items = items.map(item => TrashBinItem.create(this.itemMapper.toDTO(item)));
            this.metaRepository.set(Meta.create(meta));
        });
    }

    getItems() {
        return this.items;
    }

    async listItems(params?: TrashBinListQueryVariables) {
        const response = await this.listGateway.execute({ ...params });

        if (!response) {
            return;
        }

        runInAction(() => {
            const [items, meta] = response;

            const itemsDTO = items.map(entry => TrashBinItem.create(this.itemMapper.toDTO(entry)));
            this.items = params?.after ? uniqBy([...this.items, ...itemsDTO], "id") : itemsDTO;

            this.metaRepository.set(Meta.create(meta));
        });
    }

    async deleteItem(id: string) {
        const response = await this.deleteGateway.execute(id);

        if (response) {
            runInAction(() => {
                this.items = this.items.filter(item => item.id !== id);
                this.metaRepository.decreaseTotalCount(1);
            });
        }
    }
}
