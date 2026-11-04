import { createAbstraction } from "@webiny/feature/admin";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";

export type ExclusionDialogMode = "add" | "edit";

// The page as the source (R337), the mode, and the entry's user for Edit (null for Add).
export interface ExclusionDialogInitParams {
    source: ExclusionsSource;
    mode: ExclusionDialogMode;
    userId: string | null;
}

export interface ExclusionDialogUserVm {
    value: string | null;
    selected: PickerOption | null;
    // The search results (Add); empty for Edit.
    options: PickerOption[];
    // Edit: the user cannot be changed.
    locked: boolean;
    // `Choose a user.` or `Could not load users.`, else null.
    error: string | null;
}

// The one note slot of the Edit dialog (R324); the view picks the icon by kind.
export interface ExclusionDialogNoteVm {
    kind: "expired" | "deletedUser";
    text: string;
}

export interface ExclusionDialogVm {
    title: string;
    user: ExclusionDialogUserVm;
    reason: string;
    // The picked day `yyyy-MM-dd`, or null.
    date: string | null;
    // Local midnight of today in the viewer's zone: the earliest pickable day (R319, R337).
    minDate: Date;
    // `Pick today or a later date.` for a changed date before today, else null.
    dateError: string | null;
    dateHint: string;
    showClear: boolean;
    note: ExclusionDialogNoteVm | null;
    // The failed save's alert (R325), else null.
    alert: string | null;
    // `Add exclusion`, `Save` or `Saving…`.
    confirmLabel: string;
    saving: boolean;
}

export interface IExclusionDialogPresenter {
    readonly vm: ExclusionDialogVm;
    init(params: ExclusionDialogInitParams): void;
    searchUsers(search: string): void;
    setUser(userId: string | null): void;
    setReason(reason: string): void;
    setDate(date: string | null): void;
    clearDate(): void;
    submit(): Promise<void>;
    // `Remove entry` on a deleted user's entry: the page swaps in the Remove dialog (R324).
    removeEntry(): void;
    cancel(): void;
    dispose(): void;
}

export const ExclusionDialogPresenter = createAbstraction<IExclusionDialogPresenter>(
    "Workflows/ExclusionDialogPresenter"
);

export namespace ExclusionDialogPresenter {
    export type Interface = IExclusionDialogPresenter;
    export type ViewModel = ExclusionDialogVm;
}
