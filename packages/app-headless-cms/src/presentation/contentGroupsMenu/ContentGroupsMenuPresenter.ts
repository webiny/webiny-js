import { makeAutoObservable, runInAction, computed } from "mobx";
import { ListModelGroupsUseCase } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { ModelGroupsCache } from "~/features/modelGroup/abstractions.js";
import {
    ContentGroupsMenuPresenter as Abstraction,
    type IContentGroupsMenuPresenter,
    type IContentGroupsMenuPresenterViewModel
} from "./abstractions.js";

class ContentGroupsMenuPresenterImpl implements IContentGroupsMenuPresenter {
    private _loading = true;

    constructor(
        private listModelGroupsUseCase: ListModelGroupsUseCase.Interface,
        private cache: ModelGroupsCache.Interface
    ) {
        makeAutoObservable<ContentGroupsMenuPresenterImpl, "listModelGroupsUseCase" | "cache">(
            this,
            {
                listModelGroupsUseCase: false,
                cache: false,
                vm: computed
            }
        );
    }

    get vm(): IContentGroupsMenuPresenterViewModel {
        return {
            loading: this._loading,
            groups: this.cache.getItems()
        };
    }

    async init(): Promise<void> {
        try {
            await this.listModelGroupsUseCase.execute();
        } finally {
            runInAction(() => {
                this._loading = false;
            });
        }
    }
}

export const ContentGroupsMenuPresenter = Abstraction.createImplementation({
    implementation: ContentGroupsMenuPresenterImpl,
    dependencies: [ListModelGroupsUseCase, ModelGroupsCache]
});
