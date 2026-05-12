import { makeAutoObservable, runInAction, computed } from "mobx";
import type {
    IDataSource,
    IDataSourceQuery,
    IDataSourceMeta
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListFilesUseCase } from "../../features/listFiles/abstractions.js";
import type { IGetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { FmFile } from "../../features/shared/types.js";
import { DEFAULT_SCOPE } from "~/domain/constants.js";

export class FileListDataSource implements IDataSource<FmFile> {
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;

    constructor(
        private listFilesUseCase: IListFilesUseCase,
        private cache: IListCache<FmFile>,
        private getDescendantFoldersUseCase?: IGetDescendantFoldersUseCase,
        private scope?: string
    ) {
        makeAutoObservable<FileListDataSource, "listFilesUseCase" | "getDescendantFoldersUseCase">(
            this,
            {
                listFilesUseCase: false,
                getDescendantFoldersUseCase: false,
                rows: computed
            }
        );
    }

    get rows(): FmFile[] {
        return this.cache.getItems();
    }

    get meta(): IDataSourceMeta {
        return this._meta;
    }

    get loading(): boolean {
        return this._loading;
    }

    async query(params: IDataSourceQuery): Promise<void> {
        this._loading = true;
        this.cache.clear();

        const where = this.buildWhere(params);
        const sort = params.sort ? [`${params.sort.field}_${params.sort.direction}`] : undefined;

        const result = await this.listFilesUseCase.execute({
            search: params.search,
            where,
            sort,
            limit: params.limit,
            after: params.cursor
        });

        runInAction(() => {
            this.cache.addItems(result.data);
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

        const where = this.buildWhere(params);
        const sort = params.sort ? [`${params.sort.field}_${params.sort.direction}`] : undefined;

        const result = await this.listFilesUseCase.execute({
            search: params.search,
            where,
            sort,
            limit: params.limit,
            after: params.cursor
        });

        runInAction(() => {
            this.cache.addItems(result.data);
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }

    private buildWhere(params: IDataSourceQuery): Record<string, unknown> {
        const where: Record<string, unknown> = { ...params.filters };

        const includeSubFolders = where["includeSubFolders"] === true;
        delete where["includeSubFolders"];

        const tags = where["tags"] as string[] | undefined;
        const tagsRule = (where["tags_rule"] as string) || "OR";
        delete where["tags"];
        delete where["tags_rule"];

        if (this.scope) {
            where["tags_startsWith"] = this.scope;
        } else {
            where["tags_not_startsWith"] = DEFAULT_SCOPE;
        }

        if (tags && tags.length > 0) {
            const andConditions: Record<string, unknown>[] = [];
            if (tagsRule === "OR") {
                andConditions.push({ tags_in: tags });
            } else {
                andConditions.push(...tags.map(tag => ({ tags_in: [tag] })));
            }
            where["AND"] = andConditions;
        }

        if (where["folderId"]) {
            const currentFolderId = where["folderId"] as string;
            const isRoot = currentFolderId === "root";

            if (params.search && isRoot) {
                // Search from root: no location filter — search all folders.
            } else if ((params.search || includeSubFolders) && this.getDescendantFoldersUseCase) {
                const descendants = this.getDescendantFoldersUseCase.execute(currentFolderId);
                const folderIds = descendants.map(f => f.id);
                where["location"] = { folderId_in: folderIds };
            } else {
                where["location"] = { folderId: currentFolderId };
            }

            delete where["folderId"];
        }

        return where;
    }
}
