import { createAbstraction } from "@webiny/feature/api";
import type { StepRunTaskIdentity } from "~/domain/review/getStaleStepRunReason.js";
import type { Actor, AiIssue, ReviewData, ReviewStep } from "~/domain/review/types.js";

/**
 * `approved` and `rejected` end the step; a `rejected` outcome needs a comment of 10 or more
 * characters after trimming (D100). `issues` are the AI findings stored on the step (R171).
 */
export interface StepRunnerDecisionOutcome {
    type: "approved" | "rejected";
    comment?: string;
    issues?: AiIssue[];
}

/** Run the step again: `wait` seconds later, with `state` handed back on the next call. */
export interface StepRunnerContinueOutcome {
    type: "continue";
    wait?: number;
    state?: Record<string, unknown>;
}

export type StepRunnerOutcome = StepRunnerDecisionOutcome | StepRunnerContinueOutcome;

/** Fixed texts stored as the step's reason when the step fails (R146); never a raw error. */
export interface StepRunnerFailureReasons {
    /** The run threw, or its outcome could not be applied. */
    error: string;
    /** The task was aborted. */
    aborted: string;
    /** The task ended without writing a result (stuck detection, R152). */
    stuck: string;
}

export interface StepRunnerRunParams {
    /** The review as stored when the run started; read-only for the runner. */
    review: ReviewData;
    /** The step being run, from the review snapshot (A53). */
    step: ReviewStep;
    /** The review's requester: the identity everything runs as (R161). */
    requester: Actor;
    /** The task's own identity, the one the stale guard compares (R144). */
    task: StepRunTaskIdentity;
    /** The runner's own run count: 1 on the first call, +1 for every `continue`; waits for the task id are not counted (R163). */
    iteration: number;
    /** The `state` of the previous `continue` outcome; `null` on the first call. */
    state: Record<string, unknown> | null;
    /** Fires when the task's remaining runtime is nearly used up (R175). */
    signal: AbortSignal;
}

export interface IStepRunner {
    /** The step type this runner runs (`step.type`). */
    readonly type: string;
    /**
     * True when the runner never returns `continue`: the handler persists `{ idWaits, state }`
     * before calling it and refuses a re-entered task (R170). False for automation.
     */
    readonly singleRun: boolean;
    readonly failureReasons: StepRunnerFailureReasons;
    /** The fixed reason when the task hit its iteration ceiling (R145). */
    maxIterationsReason(step: ReviewStep): string;
    /** The actor that owns the step and applies its outcome (R141, R164). */
    getActor(requester: Actor): Actor;
    /** Throws `StepRunFailure` for a failure with a fixed reason (R146). */
    run(params: StepRunnerRunParams): Promise<StepRunnerOutcome>;
}

/**
 * Runs one step type inside the private `workflowsStepRun` task (R168). Multi-registered; the
 * registry returns the last registration per `type`. The handler owns what is shared (read, stale
 * guard, id wait, identity, applying the outcome, the one failure path); a runner owns what is
 * specific to its step type.
 */
export const StepRunner = createAbstraction<IStepRunner>("StepRunner");

export namespace StepRunner {
    export type Interface = IStepRunner;
    export type Outcome = StepRunnerOutcome;
    export type Params = StepRunnerRunParams;
    export type FailureReasons = StepRunnerFailureReasons;
}
