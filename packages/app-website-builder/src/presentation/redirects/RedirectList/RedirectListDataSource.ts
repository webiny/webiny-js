import { FolderAwareDataSource } from "@webiny/app-admin/presentation/listPresenter/FolderAwareDataSource.js";
import type {
    FetchParams,
    FetchResult
} from "@webiny/app-admin/presentation/listPresenter/FolderAwareDataSource.js";
import type { IListRedirectsUseCase } from "~/features/redirects/listRedirects/abstractions.js";
import type { IGetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { Redirect } from "~/domain/Redirect/Redirect.js";

export class RedirectListDataSource extends FolderAwareDataSource<Redirect> {
    constructor(
        private listRedirectsUseCase: IListRedirectsUseCase,
        private cache: IListCache<Redirect>,
        getDescendantFoldersUseCase?: IGetDescendantFoldersUseCase
    ) {
        super({
            keyField: "id",
            getDescendantFolders: getDescendantFoldersUseCase
        });
    }

    get rows(): Redirect[] {
        return this.queryMatcher.filter(this.cache.getItems());
    }

    async fetch(params: FetchParams): Promise<FetchResult<Redirect>> {
        return this.listRedirectsUseCase.execute({
            search: params.search,
            where: params.where,
            sort: params.sort,
            limit: params.limit,
            after: params.after
        });
    }
}
