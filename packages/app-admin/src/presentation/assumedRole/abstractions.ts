import { createAbstraction } from "@webiny/feature/admin";
import type { AssumedRoleContext } from "~/features/assumedRole/index.js";

export interface IAssumedRoleOption {
    label: string;
    // `${type}:${id}`, so a single string identifies an option across both lists.
    value: string;
    assumedRole: AssumedRoleContext.Value;
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
