import { computed, makeAutoObservable } from "mobx";
import { ListPresenter } from "~/presentation/listPresenter/abstractions.js";
import {
    TrashBinPresenter as Abstraction,
    TrashBinListGateway,
    TrashBinDeleteGateway,
    TrashBinRestoreGateway,
    TrashBinBulkActionGateway,
    type ITrashBinPresenter,
    type ITrashBinPresenterConfig,
    type ITrashBinViewModel,
    type ITrashBinActions,
    type TrashBinItem
} from "./abstractions.js";
import { TrashBinDataSource } from "./TrashBinDataSource.js";

class TrashBinPresenterImpl implements ITrashBinPresenter {
    private _nameColumnId = "id";
    private _dataSource: TrashBinDataSource | null = null;

    constructor(
        private listPresenter: ListPresenter.Interface<TrashBinItem>,
        private listGateway: TrashBinListGateway.Interface,
        private deleteGateway: TrashBinDeleteGateway.Interface,
        private restoreGateway: TrashBinRestoreGateway.Interface,
        private bulkActionGateway: TrashBinBulkActionGateway.Interface
    ) {
        makeAutoObservable<
            TrashBinPresenterImpl,
            "listGateway" | "deleteGateway" | "restoreGateway" | "bulkActionGateway"
        >(this, {
            listGateway: false,
            deleteGateway: false,
            restoreGateway: false,
            bulkActionGateway: false,
            vm: computed
        });
    }

    get vm(): ITrashBinViewModel {
        return {
            list: this.listPresenter.vm,
            nameColumnId: this._nameColumnId
        };
    }

    actions: ITrashBinActions = {
        search: {
            set: (query: string) => this.listPresenter.actions.search.set(query),
            clear: () => this.listPresenter.actions.search.clear()
        },
        sort: {
            set: (field: string, direction: "ASC" | "DESC") =>
                this.listPresenter.actions.sort.set(field, direction),
            toggle: (field: string) => this.listPresenter.actions.sort.toggle(field)
        },
        filter: {
            set: (key: string, value: unknown) => this.listPresenter.actions.filter.set(key, value),
            clear: (key: string) => this.listPresenter.actions.filter.clear(key),
            clearAll: () => this.listPresenter.actions.filter.clearAll(),
            show: () => this.listPresenter.actions.filter.show(),
            hide: () => this.listPresenter.actions.filter.hide()
        },
        selection: {
            toggle: (id: string) => this.listPresenter.actions.selection.toggle(id),
            selectRangeTo: (id: string) => this.listPresenter.actions.selection.selectRangeTo(id),
            selectAll: () => this.listPresenter.actions.selection.selectAll(),
            deselectAll: () => this.listPresenter.actions.selection.deselectAll(),
            selectRows: (ids: string[]) => this.listPresenter.actions.selection.selectRows(ids),
            isSelected: (id: string) => this.listPresenter.actions.selection.isSelected(id)
        },
        loadMore: () => this.listPresenter.actions.loadMore(),
        refresh: () => this.listPresenter.actions.refresh(),

        restoreItem: async (id: string) => {
            await this.restoreGateway.execute(id);
            if (this._dataSource) {
                this._dataSource.removeItem(id);
            }
        },

        deleteItem: async (id: string) => {
            await this.deleteGateway.execute(id);
            if (this._dataSource) {
                this._dataSource.removeItem(id);
            }
        },

        bulkRestore: async (params?) => {
            const selectedIds = Array.from(this.listPresenter.vm.selection.selectedIds);
            await this.bulkActionGateway.execute({
                action: "Restore",
                where: params?.where ?? { id_in: selectedIds },
                search: params?.search
            });
            this.listPresenter.actions.selection.deselectAll();
            await this.listPresenter.actions.refresh();
        },

        bulkDelete: async (params?) => {
            const selectedIds = Array.from(this.listPresenter.vm.selection.selectedIds);
            await this.bulkActionGateway.execute({
                action: "Delete",
                where: params?.where ?? { id_in: selectedIds },
                search: params?.search
            });
            this.listPresenter.actions.selection.deselectAll();
            await this.listPresenter.actions.refresh();
        }
    };

    init(config: ITrashBinPresenterConfig): void {
        this._nameColumnId = config.nameColumnId;

        this._dataSource = new TrashBinDataSource(this.listGateway);

        this.listPresenter.init({
            dataSource: this._dataSource,
            initialSort: config.initialSort ?? { field: "deletedOn", direction: "DESC" }
        });
    }

    dispose(): void {
        this._dataSource = null;
    }
}

export const TrashBinPresenterImplementation = Abstraction.createImplementation({
    implementation: TrashBinPresenterImpl,
    dependencies: [
        ListPresenter,
        TrashBinListGateway,
        TrashBinDeleteGateway,
        TrashBinRestoreGateway,
        TrashBinBulkActionGateway
    ]
});
