import { createAbstraction } from "@webiny/feature/admin";
import type { AssumePermissionsContext } from "~/features/assumePermissions/abstractions.js";
import type { AssumePermissionsUseCase } from "~/features/assumePermissions/abstractions.js";

export interface IAssumePermissionsOption {
    // `${type}:${id}`, so a single string identifies an option across both lists.
    value: string;
    label: string;
}

export interface IAssumePermissionsViewModel {
    loading: boolean;
    switching: boolean;
    roleOptions: IAssumePermissionsOption[];
    teamOptions: IAssumePermissionsOption[];
    assumed: AssumePermissionsContext.Value | null;
    // Whether the signed-in user may start a preview at all. Mirrors the API's own rule.
    canAssume: boolean;
    error: string | null;
}

export interface IAssumePermissionsPresenter {
    readonly vm: IAssumePermissionsViewModel;
    load(): Promise<void>;
    // Picks one of the loaded options by its `value`. Does nothing before `load()` has run.
    assume(value: string): Promise<void>;
    // Previews a role or team the caller already knows, such as the one open in its edit form.
    assumeTarget(target: AssumePermissionsUseCase.Target): Promise<void>;
    exit(): Promise<void>;
    dismissError(): void;
}

export const AssumePermissionsPresenter = createAbstraction<IAssumePermissionsPresenter>(
    "AssumePermissionsPresenter"
);

export namespace AssumePermissionsPresenter {
    export type Interface = IAssumePermissionsPresenter;
    export type ViewModel = IAssumePermissionsViewModel;
    export type Option = IAssumePermissionsOption;
    export type Target = AssumePermissionsUseCase.Target;
}
