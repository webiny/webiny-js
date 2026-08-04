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
            getDescendantFolders: getDescendantFoldersUseCase,
            localFilters: {
                accept: (item, value) => {
                    const mimeTypes = value as string[];
                    if (!mimeTypes || mimeTypes.length === 0) {
                        return true;
                    }
                    return mimeTypes.some(pattern => {
                        if (pattern.endsWith("/*")) {
                            return item.type.startsWith(pattern.slice(0, -1));
                        }
                        return item.type === pattern;
                    });
                }
            }
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

        const accept = where["accept"] as string[] | undefined;
        delete where["accept"];

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

        if (accept && accept.length > 0) {
            const exact: string[] = [];
            const prefixes: string[] = [];
            for (const mime of accept) {
                if (mime.endsWith("/*")) {
                    prefixes.push(mime.slice(0, -1));
                } else {
                    exact.push(mime);
                }
            }

            if (prefixes.length === 0) {
                where["type_in"] = exact;
            } else if (exact.length === 0 && prefixes.length === 1) {
                where["type_startsWith"] = prefixes[0];
            } else {
                const orConditions: Record<string, unknown>[] = [];
                if (exact.length > 0) {
                    orConditions.push({ type_in: exact });
                }
                for (const prefix of prefixes) {
                    orConditions.push({ type_startsWith: prefix });
                }
                where["OR"] = [
                    ...((where["OR"] as Record<string, unknown>[]) ?? []),
                    ...orConditions
                ];
            }
        }
    }
}
