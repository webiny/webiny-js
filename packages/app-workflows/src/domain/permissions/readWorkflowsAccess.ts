import type { Permission } from "@webiny/app-admin";
import type { WorkflowsAccess } from "./WorkflowsAccess.js";

const ANY_PERMISSION_NAME = "*";
const WORKFLOWS_FULL_ACCESS_NAME = "workflows.*";
const WORKFLOWS_PERMISSION_NAME = "workflows";

/*
 * Reads the Workflows access from a role's whole permission list (R333, Q60, Q68.5), the way the
 * server and `getWorkflowsPermissionSet` read it. `*` is full access the group cannot change (the
 * API key form shows it), so it reads as Full and locked. `workflows.*` reads as Full whatever other
 * keys it carries (the legacy `editor: true`). Otherwise every `workflows` entry adds its flags,
 * only `=== true` counting, and the level is Custom even with nothing set (QBZ-77). A value that is
 * not an array reads as No access. Pure.
 */
export const readWorkflowsAccess = (value: Permission[]): WorkflowsAccess => {
    if (!Array.isArray(value)) {
        return { level: "none", editor: false, reassign: false, locked: false };
    }

    const anyAccess = value.some(entry => entry.name === ANY_PERMISSION_NAME);
    if (anyAccess) {
        return { level: "full", editor: false, reassign: false, locked: true };
    }

    const fullAccess = value.some(entry => entry.name === WORKFLOWS_FULL_ACCESS_NAME);
    if (fullAccess) {
        return { level: "full", editor: false, reassign: false, locked: false };
    }

    const entries = value.filter(entry => entry.name === WORKFLOWS_PERMISSION_NAME);
    if (entries.length === 0) {
        return { level: "none", editor: false, reassign: false, locked: false };
    }

    const editor = entries.some(entry => entry.editor === true);
    const reassign = entries.some(entry => entry.reassign === true);

    return { level: "custom", editor, reassign, locked: false };
};
