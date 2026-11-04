import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";

// A user of the list as the page names it (R321): found by `listUsers`, deleted, or not known yet.
export interface ExclusionUserName {
    userId: string;
    // The display name, `Deleted user`, or the raw id while unknown.
    label: string;
    state: "found" | "deleted" | "unknown";
}

// What a dialog hands back after a successful save (R318).
export interface ApplySavedParams {
    // The record the server returned; it becomes the last-loaded list.
    settings: WorkflowSettings;
    change: "add" | "edit" | "remove";
    // The user picked in the Add dialog, so its name is known without a lookup; null otherwise.
    user: WorkflowUserSummary | null;
}

/*
 * What the dialog presenters read from and write to the page (R318, R337): the last-loaded list
 * (a dialog builds its whole-list payload from it), the viewer's zone, the user names, and the
 * writes after a save. The page presenter implements it.
 */
export interface ExclusionsSource {
    getExclusions(): WorkflowExclusion[];
    getTimeZone(): string;
    getUserName(userId: string): ExclusionUserName;
    applySaved(params: ApplySavedParams): void;
    // Replaces the open dialog with the Remove dialog of that user (`Remove entry`, R324).
    openRemove(userId: string): void;
    closeDialog(): void;
}
