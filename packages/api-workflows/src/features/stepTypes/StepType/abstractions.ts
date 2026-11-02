import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ZodType } from "zod";
import type { Review } from "~/domain/review/Review.js";
import type { Actor, ReviewStep } from "~/domain/review/types.js";
import type { ReviewInvalidStateError, ReviewStepNotCurrentError } from "~/domain/review/errors.js";
import type { WorkflowValidationError } from "~/domain/workflow/errors.js";
import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";

export interface StepTypeAvailability {
    available: boolean;
    /** Why the type cannot be added now; `null` when available. */
    unavailableReason: string | null;
}

export interface StepTypeValidateParams {
    /** The step as the editor saved it; its `id` and `title` are already checked. */
    step: WorkflowStep;
    /** The workflow being saved (its models are already checked). */
    workflow: WorkflowValues;
}

export interface StepTypeReachParams {
    review: Review;
    /** The pending step being reached. */
    step: ReviewStep;
    /** Who caused the step to be reached. */
    actor: Actor;
    now: string;
}

export interface IStepType {
    /** Stored on `WorkflowStep.type`, e.g. "review". */
    readonly type: string;
    readonly title: string;
    /** Validates the step's `config`; `null` when the type has no editable config. */
    readonly configSchema: ZodType | null;
    describeAvailability(): Promise<StepTypeAvailability>;
    /**
     * Save-time validation of one step. Pure of I/O: a type that needs a registry gets it
     * injected. Returns the step with its normalised `config`.
     */
    validate(params: StepTypeValidateParams): Result<WorkflowStep, WorkflowValidationError>;
    /**
     * Optional save-time check that needs I/O (R165), e.g. "the chosen model has a configured
     * connection". Runs after `validate` of every step and after the save's conflict,
     * not-found and same-model checks, and only for a step that is new or whose normalised
     * `config` differs from the stored workflow's, so a workflow whose external resource was
     * removed later can still be saved without touching that step. `params.step` is the step
     * `validate` returned. A throw is a `WorkflowPersistenceError`.
     */
    checkConfig?(params: StepTypeValidateParams): Promise<Result<void, WorkflowValidationError>>;
    /**
     * Puts the pending step of the review into its next state (spec 5.2). Returns the review's
     * transition errors as they are (R159); never swallows one.
     */
    reach(
        params: StepTypeReachParams
    ): Promise<Result<void, ReviewInvalidStateError | ReviewStepNotCurrentError>>;
}

/**
 * A kind of workflow step (spec 4.1, 7.1, R131). Multi-registered: the engine registers `review`
 * and `automation`; ai-powerups registers `ai` (R177). `StepTypeRegistryService` returns the last
 * registration per `type`. The save-time validation, `listStepTypes` and the step reach go
 * through it.
 */
export const StepType = createAbstraction<IStepType>("StepType");

export namespace StepType {
    export type Interface = IStepType;
    export type Availability = StepTypeAvailability;
    export type ValidateParams = StepTypeValidateParams;
    export type CheckConfig = NonNullable<IStepType["checkConfig"]>;
    export type ReachParams = StepTypeReachParams;
}
