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
