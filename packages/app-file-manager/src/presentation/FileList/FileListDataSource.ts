import { FolderAwareDataSource } from "@webiny/app-admin/presentation/listPresenter/FolderAwareDataSource.js";
import type {
    FetchParams,
    FetchResult
} from "@webiny/app-admin/presentation/listPresenter/FolderAwareDataSource.js";
import type { IGetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import { DEFAULT_SCOPE } from "~/domain/constants.js";
import type { IListFilesUseCase } from "~/features/listFiles/index.js";
import type { FmFile } from "~/features/shared/types.js";

export class FileListDataSource extends FolderAwareDataSource<FmFile> {
    constructor(
        private listFilesUseCase: IListFilesUseCase,
        private cache: IListCache<FmFile>,
        getDescendantFoldersUseCase?: IGetDescendantFoldersUseCase,
        private scope?: string
    ) {
        super({
            keyField: "id",
            getDescendantFolders: getDescendantFoldersUseCase
        });
    }

    get rows(): FmFile[] {
        return this.queryMatcher.filter(this.cache.getItems());
    }

    async fetch(params: FetchParams): Promise<FetchResult<FmFile>> {
        return this.listFilesUseCase.execute({
            search: params.search,
            where: params.where,
            sort: params.sort,
            limit: params.limit,
            after: params.after
        });
    }

    protected override shouldExpandFolders(filters: Record<string, unknown>): boolean {
        return filters["includeSubFolders"] === true;
    }

    protected override customizeWhere(
        where: Record<string, unknown>,
        filters: Record<string, unknown>
    ): void {
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
    }
}
