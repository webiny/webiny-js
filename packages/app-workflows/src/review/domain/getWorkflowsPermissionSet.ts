import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import type { IWorkflowsSecurityPermission } from "~/types.js";
import type { WorkflowsPermissionSet } from "./types.js";

const WORKFLOWS_PERMISSION_NAME = "workflows";
const WORKFLOWS_FULL_ACCESS_NAME = "workflows.*";

/*
 * What the signed-in identity may do in workflows (R259), for display gates only: the server keeps
 * every check. `getPermission("workflows.*")` finds the exact full-access entry or a pattern entry
 * that matches it (`*`), as the server's `isFullAccess` does. `getPermissions("workflows")` returns
 * one entry per role that has one, so several roles add up. The stored values are booleans. Pure.
 */
export const getWorkflowsPermissionSet = (identity: Identity): WorkflowsPermissionSet => {
    const fullAccess = identity.getPermission(WORKFLOWS_FULL_ACCESS_NAME) !== null;
    const entries =
        identity.getPermissions<IWorkflowsSecurityPermission>(WORKFLOWS_PERMISSION_NAME);

    const editor = fullAccess || entries.some(entry => entry.editor === true);
    const reassign = fullAccess || entries.some(entry => entry.reassign === true);

    return { fullAccess, editor, reassign };
};
