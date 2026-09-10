import { makeAutoObservable, runInAction } from "mobx";
import { ListTeamsUseCase } from "~/features/accessManagement/teams/listTeams/abstractions.js";
import {
    TeamsAutocompletePresenter as Abstraction,
    type ITeamsAutocompletePresenter,
    type ITeamsAutocompleteViewModel
} from "./abstractions.js";

class TeamsAutocompletePresenterImpl implements ITeamsAutocompletePresenter {
    private _loading = true;
    private _options: ITeamsAutocompleteViewModel["options"] = [];
    private _initialized = false;

    constructor(private listTeamsUseCase: ListTeamsUseCase.Interface) {
        makeAutoObservable<TeamsAutocompletePresenterImpl, "listTeamsUseCase" | "_initialized">(
            this,
            {
                listTeamsUseCase: false,
                _initialized: false
            }
        );
    }

    get vm(): ITeamsAutocompleteViewModel {
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

        const result = await this.listTeamsUseCase.execute();
        runInAction(() => {
            this._options = result.data.map(team => ({
                label: team.name,
                value: team.id
            }));
            this._loading = false;
        });
    }
}

export const TeamsAutocompletePresenter = Abstraction.createImplementation({
    implementation: TeamsAutocompletePresenterImpl,
    dependencies: [ListTeamsUseCase]
});
