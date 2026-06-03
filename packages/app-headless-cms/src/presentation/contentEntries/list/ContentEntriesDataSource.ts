import { makeAutoObservable, runInAction } from "mobx";
import type {
    IDataSource,
    IDataSourceMeta,
    IDataSourceQuery
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import type { IListEntriesUseCase } from "~/features/contentEntry/listEntries/abstractions.js";

export class ContentEntriesDataSource implements IDataSource<CmsContentEntry> {
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;
    private _matcher: (item: CmsContentEntry) => boolean = () => true;

    constructor(
        private model: CmsModel,
        private listEntriesUseCase: IListEntriesUseCase,
        private cache: IListCache<CmsContentEntry>
    ) {
        makeAutoObservable<ContentEntriesDataSource, "model" | "listEntriesUseCase">(this, {
            model: false,
            listEntriesUseCase: false,
            rows: true
        });
    }

    get rows(): CmsContentEntry[] {
        return this.cache.getItems().filter(this._matcher);
    }

    get meta(): IDataSourceMeta {
        return this._meta;
    }

    get loading(): boolean {
        return this._loading;
    }

    async query(params: IDataSourceQuery): Promise<void> {
        this._loading = true;
        this._matcher = this.buildMatcher(params);

        try {
            const result = await this.listEntriesUseCase.execute({
                model: this.model,
                where: this.buildWhere(params),
                sort: this.buildSort(params),
                limit: params.limit,
                after: params.cursor,
                search: params.search
            });

            runInAction(() => {
                this._meta = {
                    cursor: result.meta.cursor,
                    hasMoreItems: result.meta.hasMoreItems,
                    totalCount: result.meta.totalCount
                };
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
            const result = await this.listEntriesUseCase.execute({
                model: this.model,
                where: this.buildWhere(params),
                sort: this.buildSort(params),
                limit: params.limit,
                after: this._meta.cursor ?? undefined,
                search: params.search
            });

            runInAction(() => {
                this._meta = {
                    cursor: result.meta.cursor,
                    hasMoreItems: result.meta.hasMoreItems,
                    totalCount: result.meta.totalCount
                };
            });
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }

    private buildMatcher(params: IDataSourceQuery): (item: CmsContentEntry) => boolean {
        const filters = params.filters ?? {};
        const folderId = filters.folderId as string | undefined;
        const status = filters.status as string | undefined;

        return (item: CmsContentEntry) => {
            const itemFolderId = item.wbyAco_location?.folderId;
            if (folderId && folderId !== "root") {
                if (itemFolderId !== folderId) {
                    return false;
                }
            } else {
                if (itemFolderId && itemFolderId !== "root") {
                    return false;
                }
            }
            if (status && item.meta.status !== status) {
                return false;
            }
            return true;
        };
    }

    private buildWhere(params: IDataSourceQuery): Record<string, unknown> | undefined {
        const where: Record<string, unknown> = {};
        const filters = params.filters ?? {};

        if (filters.folderId && filters.folderId !== "root") {
            where["wbyAco_location"] = { folderId: filters.folderId };
        }

        if (filters.status) {
            where["status"] = filters.status;
        }

        for (const [key, value] of Object.entries(filters)) {
            if (key === "folderId" || key === "status") {
                continue;
            }
            where[key] = value;
        }

        return Object.keys(where).length > 0 ? where : undefined;
    }

    private buildSort(params: IDataSourceQuery): string[] | undefined {
        if (!params.sort) {
            return undefined;
        }
        return [`${params.sort.field}_${params.sort.direction}`];
    }
}
