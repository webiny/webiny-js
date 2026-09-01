import { makeAutoObservable, runInAction, computed } from "mobx";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { createAppName } from "~/utils/appName.js";
import { CmsWorkflowsEditorPresenter as Abstraction, type WorkflowApp } from "./abstractions.js";

class CmsWorkflowsEditorPresenterImpl implements Abstraction.Interface {
    private _loading = true;

    constructor(
        private listModelsUseCase: ListModelsUseCase.Interface,
        private cache: ModelsCache.Interface
    ) {
        makeAutoObservable<CmsWorkflowsEditorPresenterImpl, "listModelsUseCase" | "cache">(this, {
            listModelsUseCase: false,
            cache: false,
            vm: computed
        });
    }

    get vm(): Abstraction.ViewModel {
        const apps: WorkflowApp[] = this.cache
            .getItems()
            .filter(model => {
                if (model.tags.includes("$publishing:false")) {
                    return false;
                }
                if (model.tags.includes("singleEntry")) {
                    return false;
                }
                return true;
            })
            .map(model => ({
                id: createAppName(model),
                name: model.name,
                modelId: model.modelId,
                icon: model.icon
            }));

        return {
            loading: this._loading,
            apps
        };
    }

    init(): void {
        this.listModelsUseCase
            .execute()
            .then(() => {
                runInAction(() => {
                    this._loading = false;
                });
            })
            .catch(console.error);
    }
}

export const CmsWorkflowsEditorPresenter = Abstraction.createImplementation({
    implementation: CmsWorkflowsEditorPresenterImpl,
    dependencies: [ListModelsUseCase, ModelsCache]
});
