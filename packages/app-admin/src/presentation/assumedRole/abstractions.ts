import { createAbstraction } from "@webiny/feature/admin";
import type { AssumedRoleContext } from "~/features/assumedRole/abstractions.js";
import type { AssumeRoleUseCase } from "~/features/assumedRole/abstractions.js";

export interface IAssumedRoleOption {
    // `${type}:${id}`, so a single string identifies an option across both lists.
    value: string;
    type: "role" | "team";
    label: string;
    description: string;
    // The signed-in user's own role or team. Their real one, which login reports even mid-preview.
    isCurrent: boolean;
    fullAccess: boolean;
    readOnly: boolean;
    // Names only. The view matches them against each app's permission prefix for "Can access".
    permissionNames: string[];
}

export interface IAssumedRoleViewModel {
    loading: boolean;
    switching: boolean;
    roleOptions: IAssumedRoleOption[];
    teamOptions: IAssumedRoleOption[];
    assumedRole: AssumedRoleContext.Value | null;
    // Whether the signed-in user may start a preview at all. Mirrors the API's own rule.
    canAssume: boolean;
    error: string | null;
}

export interface IAssumedRolePresenter {
    readonly vm: IAssumedRoleViewModel;
    load(): Promise<void>;
    // Picks one of the loaded options by its `value`. Does nothing before `load()` has run.
    assume(value: string): Promise<void>;
    // Previews a role or team the caller already knows, such as the one open in its edit form.
    assumeTarget(target: AssumeRoleUseCase.Target): Promise<void>;
    exit(): Promise<void>;
    dismissError(): void;
}

export const AssumedRolePresenter =
    createAbstraction<IAssumedRolePresenter>("AssumedRolePresenter");

export namespace AssumedRolePresenter {
    export type Interface = IAssumedRolePresenter;
    export type ViewModel = IAssumedRoleViewModel;
    export type Option = IAssumedRoleOption;
    export type Target = AssumeRoleUseCase.Target;
}
