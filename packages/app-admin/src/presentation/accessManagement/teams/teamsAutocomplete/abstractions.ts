import { createAbstraction } from "@webiny/feature/admin";

interface ITeamsAutocompleteOption {
    label: string;
    value: string;
}

export interface ITeamsAutocompleteViewModel {
    loading: boolean;
    options: ITeamsAutocompleteOption[];
}

export interface ITeamsAutocompletePresenter {
    readonly vm: ITeamsAutocompleteViewModel;
    init(): void;
}

export const TeamsAutocompletePresenter = createAbstraction<ITeamsAutocompletePresenter>(
    "AccessManagement/TeamsAutocompletePresenter"
);

export namespace TeamsAutocompletePresenter {
    export type Interface = ITeamsAutocompletePresenter;
    export type ViewModel = ITeamsAutocompleteViewModel;
}
