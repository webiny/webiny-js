import { makeAutoObservable, runInAction, computed } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { CmsModel } from "~/types.js";
import { ListModelsUseCase } from "~/features/model/listModels/abstractions.js";
import { DeleteModelUseCase } from "~/features/model/deleteModel/abstractions.js";
import { CancelDeleteModelUseCase } from "~/features/model/cancelDeleteModel/abstractions.js";
import { ExportModelsUseCase } from "~/features/model/exportModels/abstractions.js";
import { ModelsCache } from "~/features/model/abstractions.js";
import { ContentModelsPresenter as Abstraction } from "./abstractions.js";
import { ContentModelsDataSource, isListedModel } from "./ContentModelsDataSource.js";

class ContentModelsPresenterImpl implements Abstraction.Interface {
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

    get vm(): Abstraction.ViewModel {
        return {
            loading: this.loading,
            models: this.cache.getItems().filter(isListedModel)
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
            limit: 1000,
            itemLabel: { singular: "model", plural: "models" },
            assistant: {
                view: () => "Content models in Headless CMS",
                rowTitle: model => model.name,
                rowId: model => model.modelId
            }
        });

        runInAction(() => {
            this.loading = false;
        });
    }

    dispose(): void {
        this.listPresenter.dispose();
    }

    async deleteModel(modelId: string, confirmation: string) {
        return this.deleteModelUseCase.execute(modelId, confirmation);
    }

    async cancelDelete(modelId: string) {
        return this.cancelDeleteModelUseCase.execute(modelId);
    }

    async exportModels(modelIds?: string[]): Promise<Abstraction.ExportModelResponse | null> {
        return await this.exportModelsUseCase.execute(modelIds);
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
