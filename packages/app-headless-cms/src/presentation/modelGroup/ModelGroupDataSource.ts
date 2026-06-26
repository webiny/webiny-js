import { SimpleDataSource } from "@webiny/app-admin/presentation/listPresenter/SimpleDataSource.js";
import type { IDataSourceQuery } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { FetchResult } from "@webiny/app-admin/presentation/listPresenter/FolderAwareDataSource.js";
import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";
import type { IListModelGroupsUseCase } from "~/features/modelGroup/listModelGroups/abstractions.js";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";

export class ModelGroupDataSource extends SimpleDataSource<ModelGroupDto> {
    constructor(
        private listModelGroupsUseCase: IListModelGroupsUseCase,
        private cache: IListCache<ModelGroupDto>
    ) {
        super();
    }

    get rows(): ModelGroupDto[] {
        return this.cache.getItems();
    }

    async fetch(_params: IDataSourceQuery): Promise<FetchResult<ModelGroupDto>> {
        const result = await this.listModelGroupsUseCase.execute();
        return {
            data: result,
            meta: { cursor: null, hasMoreItems: false, totalCount: result.length }
        };
    }
}
