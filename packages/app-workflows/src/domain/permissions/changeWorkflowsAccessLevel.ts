import type { WorkflowsAccess } from "./WorkflowsAccess.js";
import type { WorkflowsAccessLevel } from "./WorkflowsAccessLevel.js";

/*
 * The access after the admin picks another level (R333). Custom starts with nothing ticked from No
 * access and with both boxes ticked from Full (the same access until narrowed); Full and No access
 * carry no flags. The same level, or a locked access (`*`), comes back unchanged. Pure.
 */
export const changeWorkflowsAccessLevel = (
    access: WorkflowsAccess,
    level: WorkflowsAccessLevel
): WorkflowsAccess => {
    if (access.locked || access.level === level) {
        return access;
    }

    if (level === "custom") {
        const ticked = access.level === "full";
        return { level, editor: ticked, reassign: ticked, locked: false };
    }

    return { level, editor: false, reassign: false, locked: false };
};
