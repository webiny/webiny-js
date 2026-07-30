import { makeAutoObservable, runInAction } from "mobx";
import { ListRolesUseCase } from "~/features/accessManagement/roles/listRoles/abstractions.js";
import {
    RolesAutocompletePresenter as Abstraction,
    type IRolesAutocompletePresenter,
    type IRolesAutocompleteViewModel
} from "./abstractions.js";

class RolesAutocompletePresenterImpl implements IRolesAutocompletePresenter {
    private _loading = true;
    private _options: IRolesAutocompleteViewModel["options"] = [];
    private _initialized = false;

    constructor(private listRolesUseCase: ListRolesUseCase.Interface) {
        makeAutoObservable<RolesAutocompletePresenterImpl, "listRolesUseCase" | "_initialized">(
            this,
            {
                listRolesUseCase: false,
                _initialized: false
            }
        );
    }

    get vm(): IRolesAutocompleteViewModel {
        return {
            loading: this._loading,
            options: this._options
        };
    }

    async init() {
        if (this._initialized) {
            return;
        }
        this._initialized = true;

        const result = await this.listRolesUseCase.execute();
        runInAction(() => {
            this._options = result.data.map(role => ({
                label: role.name,
                value: role.id
            }));
            this._loading = false;
        });
    }
}

export const RolesAutocompletePresenter = Abstraction.createImplementation({
    implementation: RolesAutocompletePresenterImpl,
    dependencies: [ListRolesUseCase]
});
