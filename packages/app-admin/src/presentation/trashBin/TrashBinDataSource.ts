import { makeAutoObservable, runInAction } from "mobx";
import type {
    IDataSource,
    IDataSourceMeta,
    IDataSourceQuery
} from "~/presentation/listPresenter/abstractions.js";
import type { TrashBinItem, ITrashBinListGateway } from "./abstractions.js";

export class TrashBinDataSource implements IDataSource<TrashBinItem> {
    private _rows: TrashBinItem[] = [];
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;

    constructor(private listGateway: ITrashBinListGateway) {
        makeAutoObservable<TrashBinDataSource, "listGateway">(this, {
            listGateway: false
        });
    }

    get rows(): TrashBinItem[] {
        return this._rows;
    }

    get meta(): IDataSourceMeta {
        return this._meta;
    }

    get loading(): boolean {
        return this._loading;
    }

    async query(params: IDataSourceQuery): Promise<void> {
        this._loading = true;
        this._rows = [];

        try {
            const result = await this.listGateway.execute({
                where: params.filters,
                sort: this.buildSort(params),
                limit: params.limit,
                after: params.cursor,
                search: params.search
            });

            runInAction(() => {
                this._rows = result.data;
                this._meta = result.meta;
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    async loadMore(params: IDataSourceQuery): Promise<void> {
        if (!this._meta.hasMoreItems || this._loading) {
            return;
        }

        this._loading = true;

        try {
            const result = await this.listGateway.execute({
                where: params.filters,
                sort: this.buildSort(params),
                limit: params.limit,
                after: this._meta.cursor ?? undefined,
                search: params.search
            });

            runInAction(() => {
                this._rows = [...this._rows, ...result.data];
                this._meta = result.meta;
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    removeItem(id: string): void {
        this._rows = this._rows.filter(row => row.id !== id);
    }

    private buildSort(params: IDataSourceQuery): string[] | undefined {
        if (!params.sort) {
            return undefined;
        }
        return [`${params.sort.field}_${params.sort.direction}`];
    }
}
