import type { WorkflowsAccess } from "./WorkflowsAccess.js";
import { WORKFLOWS_ACCESS_COPY } from "./workflowsAccessCopy.js";

/*
 * The note under the level control (R333, QBZ-77): one per level, two for Custom (nothing ticked,
 * both ticked) and none for Custom with one box ticked. Pure.
 */
export const getWorkflowsAccessNote = (access: WorkflowsAccess): string | null => {
    if (access.level === "none") {
        return WORKFLOWS_ACCESS_COPY.noAccessNote;
    }
    if (access.level === "full") {
        return WORKFLOWS_ACCESS_COPY.fullAccessNote;
    }
    if (access.editor && access.reassign) {
        return WORKFLOWS_ACCESS_COPY.customBothNote;
    }
    if (!access.editor && !access.reassign) {
        return WORKFLOWS_ACCESS_COPY.customNoneNote;
    }
    return null;
};
