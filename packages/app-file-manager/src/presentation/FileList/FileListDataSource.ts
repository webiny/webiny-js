import type { IDataSource } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IDataSourceQuery } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IDataSourceResult } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListFilesUseCase } from "../../features/listFiles/abstractions.js";
import type { IGetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { FmFile } from "../../features/shared/types.js";

/**
 * Adapter that bridges the generic ListPresenter DataSource interface
 * with the File Manager's ListFilesUseCase.
 *
 * This is NOT a DI abstraction — it is an implementation detail
 * created by the composing FileListPresenter.
 */
export class FileListDataSource implements IDataSource<FmFile> {
    private listFilesUseCase: IListFilesUseCase;
    private getDescendantFoldersUseCase: IGetDescendantFoldersUseCase | undefined;
    private cache: IListCache<FmFile>;

    constructor(
        listFilesUseCase: IListFilesUseCase,
        cache: IListCache<FmFile>,
        getDescendantFoldersUseCase?: IGetDescendantFoldersUseCase
    ) {
        this.listFilesUseCase = listFilesUseCase;
        this.cache = cache;
        this.getDescendantFoldersUseCase = getDescendantFoldersUseCase;
    }

    async query(params: IDataSourceQuery): Promise<IDataSourceResult<FmFile>> {
        const where: Record<string, unknown> = { ...params.filters };

        // Remove UI-only filter flags before building the API query.
        const includeSubFolders = where["includeSubFolders"] === true;
        delete where["includeSubFolders"];
        // Remove tags_rule — it is a UI-only filter mode indicator.
        delete where["tags_rule"];

        // Map folderId to the location filter expected by the API.
        if (where["folderId"]) {
            const currentFolderId = where["folderId"] as string;

            if ((params.search || includeSubFolders) && this.getDescendantFoldersUseCase) {
                const descendants = this.getDescendantFoldersUseCase.execute(currentFolderId);
                const folderIds = [currentFolderId, ...descendants.map(f => f.id)];
                where["location"] = { folderId_in: folderIds };
            } else {
                where["location"] = { folderId: currentFolderId };
            }

            delete where["folderId"];
        }

        const sort = params.sort ? [`${params.sort.field}_${params.sort.direction}`] : undefined;

        const result = await this.listFilesUseCase.execute({
            search: params.search,
            where,
            sort,
            limit: params.limit,
            after: params.cursor
        });

        return {
            rows: result.data,
            meta: {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            }
        };
    }
}
