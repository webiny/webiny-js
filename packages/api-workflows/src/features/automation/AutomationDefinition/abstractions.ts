import { createAbstraction } from "@webiny/feature/api";
import type { ZodType } from "zod";
import type { ReviewData, ReviewStep } from "~/domain/review/types.js";

/**
 * What an automation answers (R135). `approved` and `rejected` end the step; a `rejected` outcome
 * needs a comment of 10 or more characters (D100). `continue` runs the automation again: `wait`
 * seconds later (the task's continue delay), with `state` handed back on the next call.
 */
export type AutomationOutcome =
    | { type: "approved" | "rejected"; comment?: string }
    | { type: "continue"; wait?: number; state?: Record<string, unknown> };

export interface AutomationRunParams<TSettings = unknown> {
    /** The step's stored settings, parsed with `settingsSchema` on this run (defaults applied). */
    settings: TSettings;
    /** The review as stored; read-only for the automation. */
    review: ReviewData;
    /** The step being run. */
    step: ReviewStep;
    /** The automation's own run count: 1 on the first call, +1 for every `continue`; waits for the task id are not counted (R163). */
    iteration: number;
    /** The `state` of the previous `continue` outcome; `null` on the first call. */
    state: Record<string, unknown> | null;
}

export interface IAutomationDefinition<TSettings = unknown> {
    /** Stored on the step as `config.automationId`; stable, a rename breaks stored workflows. */
    readonly id: string;
    /** Shown to workflow authors. */
    readonly name: string;
    /**
     * Where the automation may be used (D35): `["*"]` for every model, `["cms.*"]` for every
     * Headless CMS model, or exact namespace ids such as `["cms.article", "wb.page"]`.
     */
    readonly models: string[];
    /**
     * What the workflow author fills in when adding the automation as a step. Use an object schema:
     * the editor renders its JSON schema as a form, and the stored settings are what the author entered, parsed again on every use.
     * Credentials do not belong here: keep them in the definition's own code or configuration, so
     * workflow authors never set or see them (R154).
     */
    readonly settingsSchema: ZodType<TSettings>;
    /** How many times `run` may be called for one step (default 50); past it the step fails. */
    readonly maxIterations?: number;
    run(params: AutomationRunParams<TSettings>): Promise<AutomationOutcome>;
}

/**
 * An automation written in code (spec 7.2, R133, R134): register an implementation and it can be
 * added as a workflow step of type "automation". Multi-registered; the registry returns the last
 * registration per `id`. The engine runs it in a background task as the requester and applies
 * its outcome with the `automation` actor.
 */
export const AutomationDefinition =
    createAbstraction<IAutomationDefinition>("AutomationDefinition");

export namespace AutomationDefinition {
    export type Interface<TSettings = unknown> = IAutomationDefinition<TSettings>;
    export type Outcome = AutomationOutcome;
    export type RunParams<TSettings = unknown> = AutomationRunParams<TSettings>;
}
