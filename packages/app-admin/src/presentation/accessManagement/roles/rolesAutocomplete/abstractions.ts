import { createAbstraction } from "@webiny/feature/admin";

interface IRolesAutocompleteOption {
    label: string;
    value: string;
}

export interface IRolesAutocompleteViewModel {
    loading: boolean;
    options: IRolesAutocompleteOption[];
}

export interface IRolesAutocompletePresenter {
    readonly vm: IRolesAutocompleteViewModel;
    init(): void;
}

export const RolesAutocompletePresenter = createAbstraction<IRolesAutocompletePresenter>(
    "AccessManagement/RolesAutocompletePresenter"
);

export namespace RolesAutocompletePresenter {
    export type Interface = IRolesAutocompletePresenter;
    export type ViewModel = IRolesAutocompleteViewModel;
}
