import { makeAutoObservable, runInAction, computed } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { CmsModel } from "~/types.js";
import { ListModelsUseCase } from "~/features/model/listModels/abstractions.js";
import { DeleteModelUseCase } from "~/features/model/deleteModel/abstractions.js";
import { CancelDeleteModelUseCase } from "~/features/model/cancelDeleteModel/abstractions.js";
import { ExportModelsUseCase } from "~/features/model/exportModels/abstractions.js";
import { ModelsCache } from "~/features/model/abstractions.js";
import {
    ContentModelsPresenter as Abstraction,
    type IContentModelsPresenter,
    type IContentModelsPresenterViewModel
} from "./abstractions.js";
import { ContentModelsDataSource } from "./ContentModelsDataSource.js";

class ContentModelsPresenterImpl implements IContentModelsPresenter {
    private loading = true;

    constructor(
        private listPresenter: ListPresenter.Interface<CmsModel>,
        private listModelsUseCase: ListModelsUseCase.Interface,
        private deleteModelUseCase: DeleteModelUseCase.Interface,
        private cancelDeleteModelUseCase: CancelDeleteModelUseCase.Interface,
        private exportModelsUseCase: ExportModelsUseCase.Interface,
        private cache: ModelsCache.Interface
    ) {
        makeAutoObservable<
            ContentModelsPresenterImpl,
            | "listModelsUseCase"
            | "deleteModelUseCase"
            | "cancelDeleteModelUseCase"
            | "exportModelsUseCase"
            | "cache"
        >(this, {
            listModelsUseCase: false,
            deleteModelUseCase: false,
            cancelDeleteModelUseCase: false,
            exportModelsUseCase: false,
            cache: false,
            vm: computed
        });
    }

    get vm(): IContentModelsPresenterViewModel {
        const models = this.cache.getItems().filter(model => {
            if (!model.tags || model.tags.length === 0) {
                return true;
            }
            return !model.tags.includes("$hidden:true");
        });

        return {
            loading: this.loading,
            models
        };
    }

    get list(): ListPresenter.Interface<CmsModel> {
        return this.listPresenter;
    }

    init(): void {
        const dataSource = new ContentModelsDataSource(this.listModelsUseCase, this.cache);

        this.listPresenter.init({
            dataSource,
            initialSort: { field: "savedOn", direction: "DESC" },
            limit: 1000
        });

        runInAction(() => {
            this.loading = false;
        });
    }

    async deleteModel(modelId: string, confirmation: string) {
        return this.deleteModelUseCase.execute(modelId, confirmation);
    }

    async cancelDelete(modelId: string) {
        return this.cancelDeleteModelUseCase.execute(modelId);
    }

    async exportModels(modelIds?: string[]) {
        return this.exportModelsUseCase.execute(modelIds);
    }
}

export const ContentModelsPresenter = Abstraction.createImplementation({
    implementation: ContentModelsPresenterImpl,
    dependencies: [
        ListPresenter,
        ListModelsUseCase,
        DeleteModelUseCase,
        CancelDeleteModelUseCase,
        ExportModelsUseCase,
        ModelsCache
    ]
});
