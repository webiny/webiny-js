import type { ReviewPermissionViewer } from "./types.js";

/**
 * Who may reassign (D33): a viewer with `reassign` (full access included). Permission only (R41):
 * whether the step can be reassigned is the engine's `checkReassign` / reassign transition, which
 * reports its own state errors.
 */
export const canReassignByPermission = (viewer: ReviewPermissionViewer): boolean => {
    return viewer.permissions.reassign;
};
