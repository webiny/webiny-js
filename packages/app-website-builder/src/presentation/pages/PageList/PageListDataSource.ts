import { FolderAwareDataSource } from "@webiny/app-admin/presentation/listPresenter/FolderAwareDataSource.js";
import type {
    FetchParams,
    FetchResult
} from "@webiny/app-admin/presentation/listPresenter/FolderAwareDataSource.js";
import type { IGetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import type { Page } from "~/domain/Page/Page.js";
import type { IListPagesUseCase } from "~/features/pages/listPages/abstractions.js";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";

export class PageListDataSource extends FolderAwareDataSource<Page> {
    constructor(
        private listPagesUseCase: IListPagesUseCase,
        private cache: IListCache<Page>,
        getDescendantFoldersUseCase?: IGetDescendantFoldersUseCase
    ) {
        super({
            keyField: "entryId",
            getDescendantFolders: getDescendantFoldersUseCase
        });
    }

    get rows(): Page[] {
        return this.queryMatcher.filter(this.cache.getItems());
    }

    async fetch(params: FetchParams): Promise<FetchResult<Page>> {
        return this.listPagesUseCase.execute({
            where: params.where,
            sort: params.sort,
            search: params.search,
            limit: params.limit,
            after: params.after
        });
    }
}
