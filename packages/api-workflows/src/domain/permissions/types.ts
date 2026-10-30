/** Custom boolean actions of the `workflows` permission (spec 8, D54). */
export type WorkflowsPermissionAction = "editor" | "reassign";

/**
 * What the current identity may do in workflows (spec 8, D54). Full access (`*`, `workflows.*`)
 * sets `editor` and `reassign` too, so callers only ever read the action they need.
 */
export interface WorkflowsPermissionSet {
    fullAccess: boolean;
    editor: boolean;
    reassign: boolean;
}
