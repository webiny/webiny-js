import { makeAutoObservable, runInAction, computed } from "mobx";
import type {
    IDataSource,
    IDataSourceQuery,
    IDataSourceMeta
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { Task } from "~/admin/shared/types.js";
import type { IListTasksUseCase } from "~/admin/features/listTasks/abstractions.js";

const ENTRY_META_SORT_FIELDS = new Set([
    "id",
    "createdOn",
    "modifiedOn",
    "savedOn",
    "deletedOn",
    "restoredOn",
    "firstPublishedOn",
    "lastPublishedOn"
]);

function toSortEnum(field: string, direction: "ASC" | "DESC"): string {
    const prefix = ENTRY_META_SORT_FIELDS.has(field) ? "" : "values_";
    return `${prefix}${field}_${direction}`;
}

export class TaskExecutionsDataSource implements IDataSource<Task> {
    private _rows: Task[] = [];
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;

    constructor(private readonly listTasksUseCase: IListTasksUseCase) {
        makeAutoObservable<TaskExecutionsDataSource, "listTasksUseCase">(this, {
            listTasksUseCase: false,
            rows: computed
        });
    }

    get rows(): Task[] {
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
        const sort = params.sort
            ? [toSortEnum(params.sort.field, params.sort.direction)]
            : undefined;
        const result = await this.listTasksUseCase.execute({
            where: params.filters as Record<string, unknown> | undefined,
            sort,
            limit: params.limit,
            after: params.cursor,
            search: params.search
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
        const sort = params.sort
            ? [toSortEnum(params.sort.field, params.sort.direction)]
            : undefined;
        const result = await this.listTasksUseCase.execute({
            where: params.filters as Record<string, unknown> | undefined,
            sort,
            limit: params.limit,
            after: this._meta.cursor ?? undefined,
            search: params.search
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
