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
            getDescendantFolders: getDescendantFoldersUseCase,
            getSortValue: (entry, field) => this.getSortValue(entry, field)
        });
    }

    get rows(): CmsContentEntry[] {
        return this.queryMatcher.select(this.cache.getItems());
    }

    /**
     * Mirrors `mapSort`: the list's sort fields that are not entry fields map to the
     * fields the API sorts by.
     */
    private getSortValue(entry: CmsContentEntry, field: string): unknown {
        if (field === "live") {
            return entry.lastPublishedOn;
        }
        if (field === "name") {
            const titleFieldId = this.model.titleFieldId;
            return titleFieldId ? entry.values?.[titleFieldId] : entry.id;
        }
        return (entry as unknown as Record<string, unknown>)[field];
    }

    async fetch(params: FetchParams): Promise<FetchResult<CmsContentEntry>> {
        return this.listEntriesUseCase.execute({
            model: this.model,
            where: params.where,
            sort: this.mapSort(params.sort),
            search: params.search,
            limit: params.limit,
            after: params.after
        });
    }

    private mapSort(sort: string[] | undefined): string[] | undefined {
        if (!sort) {
            return undefined;
        }

        const titleFieldId = this.model.titleFieldId;

        return sort.map(s => {
            if (s.startsWith("live_")) {
                return s.replace(/^live_/, "lastPublishedOn_");
            }
            if (s.startsWith("name_")) {
                return titleFieldId
                    ? s.replace(/^name_/, `values_${titleFieldId}_`)
                    : s.replace(/^name_/, "id_");
            }
            return s;
        });
    }
}
