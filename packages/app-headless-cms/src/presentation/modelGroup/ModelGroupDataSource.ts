import { LocalDataSource } from "@webiny/app-admin/presentation/listPresenter/LocalDataSource.js";
import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";
import type { IListModelGroupsUseCase } from "~/features/modelGroup/listModelGroups/abstractions.js";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";

export class ModelGroupDataSource extends LocalDataSource<ModelGroupDto> {
    constructor(
        private listModelGroupsUseCase: IListModelGroupsUseCase,
        private cache: IListCache<ModelGroupDto>
    ) {
        super();
    }

    protected get items(): ModelGroupDto[] {
        return this.cache.getItems();
    }

    protected async load(): Promise<void> {
        await this.listModelGroupsUseCase.execute();
    }

    protected searchIn(group: ModelGroupDto): Array<string | null | undefined> {
        return [group.name];
    }
}
