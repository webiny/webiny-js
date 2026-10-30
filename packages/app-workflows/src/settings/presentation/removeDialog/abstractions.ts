import { createAbstraction } from "@webiny/feature/admin";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";

// The page as the source (R337) and the user whose entry is removed.
export interface RemoveExclusionDialogInitParams {
    source: ExclusionsSource;
    userId: string;
}

export interface RemoveExclusionDialogVm {
    // `Remove exclusion?`.
    title: string;
    // The R326 body, by user state.
    body: string;
    // The failed remove's alert (R325), else null.
    alert: string | null;
    removing: boolean;
}

export interface IRemoveExclusionDialogPresenter {
    readonly vm: RemoveExclusionDialogVm;
    init(params: RemoveExclusionDialogInitParams): void;
    confirm(): Promise<void>;
    // Cancel, `Close` and Escape; ignored while removing.
    cancel(): void;
    dispose(): void;
}

export const RemoveExclusionDialogPresenter = createAbstraction<IRemoveExclusionDialogPresenter>(
    "Workflows/RemoveExclusionDialogPresenter"
);

export namespace RemoveExclusionDialogPresenter {
    export type Interface = IRemoveExclusionDialogPresenter;
    export type ViewModel = RemoveExclusionDialogVm;
}
