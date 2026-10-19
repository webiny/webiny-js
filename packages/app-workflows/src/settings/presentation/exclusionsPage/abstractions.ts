import { createAbstraction } from "@webiny/feature/admin";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { ExclusionTab } from "~/settings/model/list/ExclusionTab.js";
import type { ExclusionsEmptyVm } from "~/settings/model/list/ExclusionsEmptyVm.js";
import type { ExclusionsSource } from "./ExclusionsSource.js";

// What the view passes in (R337): the viewer's `editor` flag and the resolved timezone.
export interface ExclusionsPageInitParams {
    canManage: boolean;
    timeZone: string;
}

export type ExclusionsPageStatus = "loading" | "ready" | "failed" | "noAccess";

// The open dialog: Add has no user; Edit and Remove name the entry by its user (R234).
export interface ExclusionDialogRequest {
    kind: "add" | "edit" | "remove";
    userId: string | null;
}

export interface ExclusionTabVm {
    id: ExclusionTab;
    label: "Active" | "Expired" | "All";
}

// The `Filter by user` picker (R332): the users in the list, filtered on the client.
export interface ExclusionFilterVm {
    value: string | null;
    selected: PickerOption | null;
    options: PickerOption[];
}

export interface ExclusionRowVm {
    userId: string;
    // The display name, `Deleted user` or the raw id.
    label: string;
    // A deleted user (QBZ-91).
    muted: boolean;
    // `This user no longer exists` for a deleted user, else null.
    subLine: string | null;
    // The reason or `No reason given`.
    reason: string;
    reasonMuted: boolean;
    // `Until removed`, `End of {date}` or `{date}, {HH:mm}` in the viewer's zone (R320).
    untilLabel: string;
    // The hover text with the zone (R320).
    untilTitle: string;
    status: "active" | "expired";
    statusLabel: "Active" | "Expired";
    // `Edit exclusion for {Name}` and `Remove exclusion for {Name}` (Q68.6).
    editLabel: string;
    removeLabel: string;
}

export interface ExclusionsPageVm {
    status: ExclusionsPageStatus;
    // The header's `Add exclusion`: only with `editor` and a loaded list (R329).
    canAdd: boolean;
    tab: ExclusionTab;
    tabs: ExclusionTabVm[];
    filter: ExclusionFilterVm;
    rows: ExclusionRowVm[];
    // The empty state when the list is loaded and no row shows, else null (R322).
    empty: ExclusionsEmptyVm | null;
    // The name lookup failed: the banner `Could not load user names.` (R321).
    namesFailed: boolean;
    dialog: ExclusionDialogRequest | null;
}

export interface IExclusionsPagePresenter extends ExclusionsSource {
    readonly vm: ExclusionsPageVm;
    init(params: ExclusionsPageInitParams): Promise<void>;
    // `Try again` after a failed load.
    reload(): Promise<void>;
    setTab(tab: ExclusionTab): void;
    setUserFilter(userId: string | null): void;
    searchUserFilter(search: string): void;
    openAdd(): void;
    openEdit(userId: string): void;
    dispose(): void;
}

export const ExclusionsPagePresenter = createAbstraction<IExclusionsPagePresenter>(
    "Workflows/ExclusionsPagePresenter"
);

export namespace ExclusionsPagePresenter {
    export type Interface = IExclusionsPagePresenter;
    export type ViewModel = ExclusionsPageVm;
}
