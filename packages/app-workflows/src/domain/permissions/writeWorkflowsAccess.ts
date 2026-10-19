import type { Permission } from "@webiny/app-admin";
import type { WorkflowsAccess } from "./WorkflowsAccess.js";

const WORKFLOWS_FULL_ACCESS_NAME = "workflows.*";
const WORKFLOWS_PERMISSION_NAME = "workflows";
const OWNED_KEYS = ["name", "editor", "reassign"];

const isOwnedEntry = (entry: Permission): boolean => {
    return entry.name === WORKFLOWS_PERMISSION_NAME || entry.name === WORKFLOWS_FULL_ACCESS_NAME;
};

/*
 * Writes the Workflows access into a role's permission list (R333, Q60). The group owns only the
 * `workflows` and `workflows.*` entries: they are removed, every other entry (also `*`) stays in
 * order, and the new entry is appended. Full is exactly `{ name: "workflows.*" }`. Custom is one
 * `workflows` entry that keeps every other key of the first existing `workflows` entry and carries
 * `editor: true` / `reassign: true` only for ticked boxes, so Custom with nothing ticked is
 * `{ name: "workflows" }` and reads back as Custom (QBZ-77). A locked access (`*` or another
 * pattern entry the server matches) writes nothing. A value that is not an array starts from an
 * empty list. The input is never mutated. Pure.
 */
export const writeWorkflowsAccess = (
    value: Permission[],
    access: WorkflowsAccess
): Permission[] => {
    const current: Permission[] = [];
    if (Array.isArray(value)) {
        current.push(...value);
    }

    if (access.locked) {
        return current;
    }

    const existing = current.find(entry => entry.name === WORKFLOWS_PERMISSION_NAME);
    const result = current.filter(entry => !isOwnedEntry(entry));

    if (access.level === "none") {
        return result;
    }

    if (access.level === "full") {
        result.push({ name: WORKFLOWS_FULL_ACCESS_NAME });
        return result;
    }

    const entry: Permission = { name: WORKFLOWS_PERMISSION_NAME };
    if (existing) {
        for (const [key, item] of Object.entries(existing)) {
            if (!OWNED_KEYS.includes(key)) {
                entry[key] = item;
            }
        }
    }
    if (access.editor) {
        entry.editor = true;
    }
    if (access.reassign) {
        entry.reassign = true;
    }
    result.push(entry);

    return result;
};
