import { makeObservable, observable } from "mobx";
import { SimpleDataSource } from "@webiny/app-admin/presentation/listPresenter/SimpleDataSource.js";
import type { FetchResult } from "@webiny/app-admin/presentation/listPresenter/FolderAwareDataSource.js";
import type { IDataSourceQuery } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { ListScheduledActionsGateway } from "~/features/listScheduledActions/abstractions.js";
import type { SchedulerEntry } from "~/types.js";

export class SchedulerListDataSource extends SimpleDataSource<SchedulerEntry> {
    private _rows: SchedulerEntry[] = [];

    constructor(
        private readonly gateway: ListScheduledActionsGateway.Interface,
        private readonly namespace: string
    ) {
        super();
        makeObservable<SchedulerListDataSource, "_rows">(this, {
            _rows: observable
        });
    }

    get rows(): SchedulerEntry[] {
        return this._rows;
    }

    async fetch(params: IDataSourceQuery): Promise<FetchResult<SchedulerEntry>> {
        const sort = params.sort ? [`${params.sort.field}_${params.sort.direction}`] : undefined;

        const result = await this.gateway.execute({
            namespace: this.namespace,
            where: params.filters as Record<string, any> | undefined,
            sort: sort as any,
            limit: params.limit,
            after: params.cursor
        });

        return {
            data: result.items,
            meta: result.meta
        };
    }

    override onQueryResult(data: SchedulerEntry[]): void {
        this._rows = data;
    }

    override onLoadMoreResult(data: SchedulerEntry[]): void {
        this._rows = [...this._rows, ...data];
    }
}
