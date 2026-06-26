import { makeObservable, observable } from "mobx";
import { SimpleDataSource } from "@webiny/app-admin/presentation/listPresenter/SimpleDataSource.js";
import type { FetchResult } from "@webiny/app-admin/presentation/listPresenter/FolderAwareDataSource.js";
import type { IDataSourceQuery } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { Webhook } from "~/admin/shared/types.js";
import type { IListWebhooksUseCase } from "~/admin/features/ListWebhooks/abstractions.js";

export class WebhookListDataSource extends SimpleDataSource<Webhook> {
    private _rows: Webhook[] = [];

    constructor(private readonly listWebhooksUseCase: IListWebhooksUseCase) {
        super();
        makeObservable<WebhookListDataSource, "_rows">(this, {
            _rows: observable
        });
    }

    get rows(): Webhook[] {
        return this._rows;
    }

    async fetch(params: IDataSourceQuery): Promise<FetchResult<Webhook>> {
        const sort = params.sort ? [`${params.sort.field}_${params.sort.direction}`] : undefined;
        const result = await this.listWebhooksUseCase.execute({
            where: params.filters as { enabled?: boolean } | undefined,
            sort,
            limit: params.limit,
            after: params.cursor
        });
        return { data: result.items, meta: result.meta };
    }

    override onQueryResult(data: Webhook[]): void {
        this._rows = data;
    }

    override onLoadMoreResult(data: Webhook[]): void {
        this._rows = [...this._rows, ...data];
    }
}
