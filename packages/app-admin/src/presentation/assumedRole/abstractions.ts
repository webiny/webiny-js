import { createAbstraction } from "@webiny/feature/admin";
import type { AssumedRoleContext } from "~/features/assumedRole/abstractions.js";

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
    error: string | null;
}

export interface IAssumedRolePresenter {
    readonly vm: IAssumedRoleViewModel;
    load(): Promise<void>;
    assume(value: string): Promise<void>;
    exit(): Promise<void>;
    dismissError(): void;
}

export const AssumedRolePresenter =
    createAbstraction<IAssumedRolePresenter>("AssumedRolePresenter");

export namespace AssumedRolePresenter {
    export type Interface = IAssumedRolePresenter;
    export type ViewModel = IAssumedRoleViewModel;
    export type Option = IAssumedRoleOption;
}
