/**
 * A step type the workflow editor can offer (D130). Static list; phase 5 builds it
 * from the `StepType` registry.
 */
export interface WorkflowStepTypeInfo {
    /** Stored on `WorkflowStep.type`, e.g. "review". */
    type: string;
    title: string;
    /** Whether a step of this type may be added now. */
    available: boolean;
    /** Why it is unavailable; `null` when available. */
    unavailableReason: string | null;
    /** JSON schema of the step's `config`; `null` when the type has no editable config yet. */
    configSchema: Record<string, unknown> | null;
}

/** A user as the workflows configuration screens see one (D48, D104): no email, roles or teams. */
export interface WorkflowUser {
    id: string;
    displayName: string;
}

/** The shared user list (R123). `missingIds`: requested ids with no user (D117); `[]` for a search. */
export interface WorkflowUserList {
    users: WorkflowUser[];
    missingIds: string[];
}
