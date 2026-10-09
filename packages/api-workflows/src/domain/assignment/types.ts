import type { Actor } from "~/domain/review/types.js";

/** One assignment decision (spec 4.3, D20, D45, D127). Written from phase 4. */
export interface AssignmentRecordValues {
    reviewId: string;
    workflowId: string;
    stepId: string;
    /** `null` for a pool fall-through. */
    userId: string | null;
    assignedOn: string;
    /** Rule id, "strategy", "picked", "reassign", "pool", "poolStart" or "takeOver". */
    source: string;
    /** Who acted, for reassign and take over. */
    by: Actor | null;
    /** For skips and fall-through, e.g. "pick excluded". */
    reason: string | null;
}

export interface AssignmentRecord extends AssignmentRecordValues {
    id: string;
}
