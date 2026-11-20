import { LocalDataSource } from "@webiny/app-admin/presentation/listPresenter/LocalDataSource.js";
import type { CmsModel } from "~/types.js";
import type { IListModelsUseCase } from "~/features/model/listModels/abstractions.js";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import { isListedModel } from "./isListedModel.js";

export class ContentModelsDataSource extends LocalDataSource<CmsModel> {
    constructor(
        private listModelsUseCase: IListModelsUseCase,
        private cache: IListCache<CmsModel>
    ) {
        super();
    }

    protected get items(): CmsModel[] {
        return this.cache.getItems().filter(isListedModel);
    }

    protected async load(): Promise<void> {
        await this.listModelsUseCase.execute();
    }

    protected searchIn(model: CmsModel): Array<string | null | undefined> {
        return [model.name];
    }
}
