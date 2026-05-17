import { makeAutoObservable, runInAction, computed } from "mobx";
import type {
    IDataSource,
    IDataSourceQuery,
    IDataSourceMeta
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { Webhook } from "~/admin/shared/types.js";
import type { IListWebhooksUseCase } from "~/admin/features/ListWebhooks/abstractions.js";

export class WebhookListDataSource implements IDataSource<Webhook> {
    private _rows: Webhook[] = [];
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;

    constructor(private readonly listWebhooksUseCase: IListWebhooksUseCase) {
        makeAutoObservable<WebhookListDataSource, "listWebhooksUseCase">(this, {
            listWebhooksUseCase: false,
            rows: computed
        });
    }

    get rows(): Webhook[] {
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
        const result = await this.listWebhooksUseCase.execute({
            where: params.filters as { enabled?: boolean } | undefined,
            limit: params.limit,
            after: params.cursor
        });
        runInAction(() => {
            this._rows = result.items;
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }

    async loadMore(params: IDataSourceQuery): Promise<void> {
        if (!this._meta.hasMoreItems || this._loading) {
            return;
        }
        this._loading = true;
        const result = await this.listWebhooksUseCase.execute({
            where: params.filters as { enabled?: boolean } | undefined,
            limit: params.limit,
            after: this._meta.cursor ?? undefined
        });
        runInAction(() => {
            this._rows = [...this._rows, ...result.items];
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }
}
