import { createAbstraction } from "@webiny/feature/api";
import type { ZodType } from "zod";
import type { Actor, ReviewData, ReviewStep } from "~/domain/review/types.js";
import type { StepRunTaskIdentity } from "~/domain/review/getStaleStepRunReason.js";

/**
 * What the runner supplies to every tool call (R167). It is the only place a handler learns which
 * review, step, target and task it works for: a handler never takes a target, revision, review or
 * step id from the model, so content under review cannot point a tool at another record (D55).
 */
export interface WorkflowAiToolContext {
    /** The review as stored when the step run started. */
    review: ReviewData;
    /** The AI step being run. */
    step: ReviewStep;
    /** The requester: the identity the task runs as. */
    requester: Actor;
    /** The step run task, for the stale guard. */
    task: StepRunTaskIdentity;
}

/**
 * What a tool answers. `error` is a text the model may read, so it never holds a provider or
 * storage error (the real error is logged). `execute` never rejects: a failure is `ok: false`.
 */
export interface WorkflowAiToolResult {
    ok: boolean;
    /** The answer, serialised for the model as JSON. */
    data?: unknown;
    error?: string;
}

export interface IWorkflowAiTool<TInput = unknown> {
    /** Unique; `^[A-Za-z][A-Za-z0-9_]{0,63}$`. Stored on the step's `tools`; a rename breaks stored workflows. */
    readonly name: string;
    /** The tool's title as the model receives it. */
    readonly title: string;
    /** Shown to the model: what the tool does and when to call it. */
    readonly description: string;
    /** Shown to workflow authors in the step editor: a short, plain name. */
    readonly label: string;
    /** Shown to workflow authors in the step editor: one sentence on what the tool does. */
    readonly summary: string;
    /**
     * Declare `true` when the tool writes or updates the content under review. The step editor
     * marks such tools and says the step can change content (R283). Absent means `false`.
     */
    readonly changesContent?: boolean;
    /** What the model sends. Never include a target, revision, review or step id: the context has them. */
    readonly inputSchema: ZodType<TInput>;
    execute(input: TInput, context: WorkflowAiToolContext): Promise<WorkflowAiToolResult>;
}

/**
 * A tool an AI step may call (spec 9.3, R167, D55): register an implementation and a workflow
 * author can allowlist it on an AI step. Multi-registered; the registry returns the last
 * registration per `name`. Never the global `AiSdkTools`: a step gets only the tools it lists. A
 * tool that writes is responsible for its own write path (A61).
 */
export const WorkflowAiTool = createAbstraction<IWorkflowAiTool>("WorkflowAiTool");

export namespace WorkflowAiTool {
    export type Interface<TInput = unknown> = IWorkflowAiTool<TInput>;
    export type Context = WorkflowAiToolContext;
    export type Result = WorkflowAiToolResult;
}
