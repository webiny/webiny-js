import { makeObservable, observable, runInAction } from "mobx";
import { SimpleDataSource } from "@webiny/app-admin/presentation/listPresenter/SimpleDataSource.js";
import type { IDataSourceQuery } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { FetchResult } from "@webiny/app-admin/presentation/listPresenter/FolderAwareDataSource.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import type { CmsReferenceEntry } from "~/features/contentEntry/refTypes.js";
import type { IListEntriesUseCase } from "~/features/contentEntry/listEntries/abstractions.js";

function toReferenceEntry(entry: CmsContentEntry, model: CmsModel): CmsReferenceEntry {
    return {
        id: entry.id,
        entryId: entry.entryId,
        status: entry.meta.status,
        title: entry.meta.title,
        description: entry.meta.description || null,
        image: entry.meta.image || null,
        createdOn: entry.createdOn,
        savedOn: entry.savedOn,
        createdBy: entry.createdBy,
        modifiedBy: entry.modifiedBy,
        model: { modelId: model.modelId, name: model.name },
        published:
            entry.meta.status === "published"
                ? { id: entry.id, entryId: entry.entryId, title: entry.meta.title }
                : null,
        wbyAco_location: entry.wbyAco_location ? { folderId: entry.wbyAco_location.folderId } : null
    };
}

export class RefDialogSingleModelDataSource extends SimpleDataSource<CmsReferenceEntry> {
    private _items: CmsReferenceEntry[] = [];

    constructor(
        private model: CmsModel,
        private listEntriesUseCase: IListEntriesUseCase
    ) {
        super();
        makeObservable<RefDialogSingleModelDataSource, "_items">(this, {
            _items: observable
        });
    }

    get rows(): CmsReferenceEntry[] {
        return this._items;
    }

    async fetch(params: IDataSourceQuery): Promise<FetchResult<CmsReferenceEntry>> {
        const sort = params.sort ? [`${params.sort.field}_${params.sort.direction}`] : undefined;

        const result = await this.listEntriesUseCase.execute({
            model: this.model,
            where: params.filters,
            sort,
            search: params.search,
            limit: params.limit,
            after: params.cursor
        });

        const mapped = result.data.map(entry => toReferenceEntry(entry, this.model));

        return {
            data: mapped,
            meta: result.meta
        };
    }

    protected override onQueryResult(data: CmsReferenceEntry[]): void {
        runInAction(() => {
            this._items = data;
        });
    }

    protected override onLoadMoreResult(data: CmsReferenceEntry[]): void {
        runInAction(() => {
            this._items = [...this._items, ...data];
        });
    }
}
