import type { WorkflowsAccessLevel } from "./WorkflowsAccessLevel.js";

/*
 * What the role form's Workflows group shows (R333). `editor` and `reassign` are the Custom boxes
 * ("Manage workflows", "Reassign and operate"); Full and No access carry neither. `locked` is true
 * for a `*` entry, which the group shows as Full and never changes.
 */
export interface WorkflowsAccess {
    level: WorkflowsAccessLevel;
    editor: boolean;
    reassign: boolean;
    locked: boolean;
}
