import { makeAutoObservable, runInAction, computed } from "mobx";
import {
    TaskDefinitionsPresenter as Abstraction,
    type ITaskDefinitionsPresenter,
    type ITaskDefinitionsViewModel
} from "./abstractions.js";
import { ListDefinitionsUseCase } from "~/admin/features/listDefinitions/abstractions.js";
import type { TaskDefinition } from "~/admin/shared/types.js";

class TaskDefinitionsPresenterImpl implements ITaskDefinitionsPresenter {
    private _definitions: TaskDefinition[] = [];
    private _loading = false;

    constructor(private readonly listDefinitionsUseCase: ListDefinitionsUseCase.Interface) {
        makeAutoObservable(this, { vm: computed });
    }

    get vm(): ITaskDefinitionsViewModel {
        return {
            definitions: this._definitions,
            loading: this._loading
        };
    }

    init(): void {
        this._loading = true;
        void this.listDefinitionsUseCase
            .execute()
            .then(definitions => {
                runInAction(() => {
                    this._definitions = definitions;
                    this._loading = false;
                });
            })
            .catch(() => {
                runInAction(() => {
                    this._loading = false;
                });
            });
    }
}

export const TaskDefinitionsPresenter = Abstraction.createImplementation({
    implementation: TaskDefinitionsPresenterImpl,
    dependencies: [ListDefinitionsUseCase]
});
