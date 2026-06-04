import { makeAutoObservable, runInAction } from "mobx";
import type {
    IDataSource,
    IDataSourceMeta,
    IDataSourceQuery
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import { QueryMatcher } from "@webiny/app-admin/presentation/listPresenter/QueryMatcher.js";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { IGetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import type { IListEntriesUseCase } from "~/features/contentEntry/listEntries/abstractions.js";

export class ContentEntriesDataSource implements IDataSource<CmsContentEntry> {
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;
    private queryMatcher = new QueryMatcher<CmsContentEntry>({
        keyField: "entryId",
        localFilters: {
            folderId: (item, value) => {
                const folderId = value as string;
                const itemFolderId = item.wbyAco_location?.folderId;
                if (folderId && folderId !== "root") {
                    return itemFolderId === folderId;
                }
                return !itemFolderId || itemFolderId === "root";
            },
            status: (item, value) => {
                return item.meta.status === value;
            }
        }
    });

    constructor(
        private model: CmsModel,
        private listEntriesUseCase: IListEntriesUseCase,
        private cache: IListCache<CmsContentEntry>,
        private getDescendantFoldersUseCase?: IGetDescendantFoldersUseCase
    ) {
        makeAutoObservable<
            ContentEntriesDataSource,
            "model" | "listEntriesUseCase" | "getDescendantFoldersUseCase" | "queryMatcher"
        >(this, {
            model: false,
            listEntriesUseCase: false,
            getDescendantFoldersUseCase: false,
            queryMatcher: false,
            rows: true
        });
    }

    get rows(): CmsContentEntry[] {
        return this.cache.getItems().filter(this.queryMatcher.matcher);
    }

    get meta(): IDataSourceMeta {
        return this._meta;
    }

    get loading(): boolean {
        return this._loading;
    }

    async query(params: IDataSourceQuery): Promise<void> {
        this._loading = true;

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
                this.queryMatcher.updateFromQuery(
                    params,
                    result.data.map(e => e.entryId)
                );
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
                this.queryMatcher.appendResultKeys(result.data.map(e => e.entryId));
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

    private buildWhere(params: IDataSourceQuery): Record<string, unknown> | undefined {
        const where: Record<string, unknown> = {};
        const filters = params.filters ?? {};
        const folderId = (filters.folderId as string | undefined) || "root";
        const isRoot = folderId === "root";

        if (params.search && isRoot) {
            // Search from root: no folder filter — search all folders.
        } else if (params.search && this.getDescendantFoldersUseCase) {
            const descendants = this.getDescendantFoldersUseCase.execute(folderId);
            const folderIds = descendants.map(f => f.id);
            where["wbyAco_location"] = { folderId_in: folderIds };
        } else {
            where["wbyAco_location"] = { folderId };
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
