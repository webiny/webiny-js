import { SimpleDataSource } from "@webiny/app-admin/presentation/listPresenter/SimpleDataSource.js";
import type { IDataSourceQuery } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { FetchResult } from "@webiny/app-admin/presentation/listPresenter/FolderAwareDataSource.js";
import type { CmsModel } from "~/types.js";
import type { IListModelsUseCase } from "~/features/model/listModels/abstractions.js";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";

export class ContentModelsDataSource extends SimpleDataSource<CmsModel> {
    constructor(
        private listModelsUseCase: IListModelsUseCase,
        private cache: IListCache<CmsModel>
    ) {
        super();
    }

    get rows(): CmsModel[] {
        return this.cache.getItems();
    }

    async fetch(_params: IDataSourceQuery): Promise<FetchResult<CmsModel>> {
        const result = await this.listModelsUseCase.execute();
        return {
            data: result,
            meta: { cursor: null, hasMoreItems: false, totalCount: result.length }
        };
    }
}
