import { makeAutoObservable, runInAction, computed } from "mobx";
import type {
    IDataSource,
    IDataSourceQuery,
    IDataSourceMeta
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import type { IListWebhookDeliveriesUseCase } from "~/admin/features/listWebhookDeliveries/abstractions.js";

export class WebhookDeliveriesDataSource implements IDataSource<WebhookDelivery> {
    private _rows: WebhookDelivery[] = [];
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;

    constructor(
        private readonly listDeliveriesUseCase: IListWebhookDeliveriesUseCase,
        private readonly webhookId: string
    ) {
        makeAutoObservable<WebhookDeliveriesDataSource, "listDeliveriesUseCase">(this, {
            listDeliveriesUseCase: false,
            rows: computed
        });
    }

    get rows(): WebhookDelivery[] {
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
        const result = await this.listDeliveriesUseCase.execute({
            webhookId: this.webhookId,
            limit: params.limit,
            after: params.cursor
        });
        runInAction(() => {
            this._rows = result.data;
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
        const result = await this.listDeliveriesUseCase.execute({
            webhookId: this.webhookId,
            limit: params.limit,
            after: this._meta.cursor ?? undefined
        });
        runInAction(() => {
            this._rows = [...this._rows, ...result.data];
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }
}
