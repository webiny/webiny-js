import { FolderAwareDataSource } from "@webiny/app-admin/presentation/listPresenter/FolderAwareDataSource.js";
import type {
    FetchParams,
    FetchResult
} from "@webiny/app-admin/presentation/listPresenter/FolderAwareDataSource.js";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { IGetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import type { IListEntriesUseCase } from "~/features/contentEntry/listEntries/abstractions.js";

export class ContentEntriesDataSource extends FolderAwareDataSource<CmsContentEntry> {
    constructor(
        private model: CmsModel,
        private listEntriesUseCase: IListEntriesUseCase,
        private cache: IListCache<CmsContentEntry>,
        getDescendantFoldersUseCase?: IGetDescendantFoldersUseCase,
        registeredFilterNames: string[] = []
    ) {
        super({
            locationField: "wbyAco_location",
            keyField: "entryId",
            registeredFilterNames,
            getDescendantFolders: getDescendantFoldersUseCase
        });
    }

    get rows(): CmsContentEntry[] {
        return this.queryMatcher.filter(this.cache.getItems());
    }

    async fetch(params: FetchParams): Promise<FetchResult<CmsContentEntry>> {
        return this.listEntriesUseCase.execute({
            model: this.model,
            where: params.where,
            sort: params.sort,
            search: params.search,
            limit: params.limit,
            after: params.after
        });
    }
}
