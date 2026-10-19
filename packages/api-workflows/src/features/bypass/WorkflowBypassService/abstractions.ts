import { createAbstraction } from "@webiny/feature/api";

export interface IWorkflowBypassService {
    /**
     * Runs the callback with the bypass flag set and restores the previous value in `finally`,
     * also when the callback throws. Only the automation runner (around the automation, R150) and
     * the built-in `updateTargetFields` AI tool (around its write only, R173) call it. It does
     * not touch the identity and does not widen permissions.
     */
    run<T>(callback: () => Promise<T>): Promise<T>;
    /** Whether a `run` is in progress on this request container. */
    isActive(): boolean;
}

/**
 * Request-scoped bypass context (D36, D62, spec 9.2). Only the save block
 * (`ReviewTargetUpdateGuard`) reads it; the move rule and the delete and trash blocks do not.
 */
export const WorkflowBypassService =
    createAbstraction<IWorkflowBypassService>("WorkflowBypassService");

export namespace WorkflowBypassService {
    export type Interface = IWorkflowBypassService;
}
