import type { ReviewPermissionViewer } from "./types.js";

/**
 * Who may read the background task of a step attempt (R258, D90): a viewer with `editor` or
 * `reassign` (full access sets both). Permission only: the app wrappers combine it with read
 * access to the review's target.
 */
export const canViewStepRunByPermission = (viewer: ReviewPermissionViewer): boolean => {
    return viewer.permissions.editor || viewer.permissions.reassign;
};
