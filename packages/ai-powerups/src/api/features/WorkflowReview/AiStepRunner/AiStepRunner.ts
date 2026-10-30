import { NoObjectGeneratedError, NoOutputGeneratedError, Output, stepCountIs } from "ai";
import type { ToolSet } from "ai";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getAiActor } from "@webiny/api-workflows/domain/ai/getAiActor.js";
import { REJECT_COMMENT_MIN_LENGTH } from "@webiny/api-workflows/domain/review/Review.js";
import type { Actor } from "@webiny/api-workflows/domain/review/types.js";
import { AI_STEP_TYPE } from "@webiny/api-workflows/domain/workflow/stepTypes.js";
import {
    AI_STEP_CONTENT_TOO_LARGE_MESSAGE,
    AI_TOOL_STEP_NOT_RUNNING_MESSAGE
} from "@webiny/api-workflows/features/aiTools/constants.js";
import type { WorkflowAiTool } from "@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js";
import { WorkflowAiToolRegistryService } from "@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { ReviewTargetEditorService } from "@webiny/api-workflows/features/review/ReviewTargetEditorService/index.js";
import { StepRunFailure } from "@webiny/api-workflows/features/stepRun/StepRunFailure.js";
import { STEP_RUN_STALE_CHECK_INTERVAL_MS } from "@webiny/api-workflows/features/stepRun/constants.js";
import { StepRunner } from "@webiny/api-workflows/features/stepRun/StepRunner/index.js";
import { StepRunStaleCheckService } from "@webiny/api-workflows/features/stepRun/StepRunStaleCheckService/index.js";
import {
    AiCapabilityDisabledError,
    AiModelNotAvailableError,
    ResolveAiCapabilityUseCase
} from "~/api/features/Capabilities/index.js";
import {
    AI_STEP_MAX_COMMENT_LENGTH,
    AI_STEP_MAX_ISSUES,
    AI_STEP_MAX_TOOL_STEPS,
    WORKFLOWS_REVIEW_CAPABILITY_ID
} from "../constants.js";
import { aiStepConfigSchema } from "../aiStepConfigSchema.js";
import { toLoggedAiError } from "../toLoggedAiError.js";
import { buildAiStepPrompt, exceedsAiInputLimit } from "../buildAiStepPrompt.js";
import type { AiStepPreviousComment } from "../buildAiStepPrompt.js";
import { aiReviewOutputSchema, normalizeAiIssues } from "../aiReviewOutputSchema.js";
import {
    AI_CAPABILITY_NOT_AVAILABLE_REASON,
    AI_REVIEW_FAILED_REASON,
    AI_STEP_INVALID_CONFIGURATION_REASON,
    aiModelNotAvailableReason,
    aiToolNotAvailableReason
} from "../aiFailureReasons.js";
import {
    AI_REVIEW_NO_DECISION_REASON,
    AI_REVIEW_REJECTED_WITHOUT_COMMENT_REASON,
    AI_REVIEW_TIMED_OUT_REASON,
    getAiStepLimitReason
} from "./aiRunFailureReasons.js";

/**
 * Runs one `ai` step (R170, R171, R175; spec 7.3): one `generateText` call with the structured
 * decision output and the step's allowlisted tools, then the outcome the handler applies after
 * its own re-guard. It never writes: the only writer is the `updateTargetFields` tool, which
 * re-guards itself (R173). Every failure is a `StepRunFailure` with a fixed text; raw errors are
 * logged here and never stored or shown to the model (R87).
 *
 * The call can run for minutes. A cancel or a restart under another task is noticed through
 * `StepRunStaleCheckService`, called through one per-run closure before every tool execution and
 * in a stop condition, at most once per `STEP_RUN_STALE_CHECK_INTERVAL_MS` and sticky once it said
 * stale, with local state only (the SDK swallows throws from `onStepFinish`, so the flag is read
 * after the call, before any output). A failed read counts as not stale: the post-run guard
 * protects the write.
 */
class AiStepRunnerImpl implements StepRunner.Interface {
    public readonly type = AI_STEP_TYPE;
    public readonly singleRun = true;
    public readonly failureReasons: StepRunner.FailureReasons = {
        error: AI_REVIEW_FAILED_REASON,
        aborted: "The AI review was aborted.",
        stuck: "The AI review task ended without a result."
    };

    public constructor(
        private resolveCapability: ResolveAiCapabilityUseCase.Interface,
        private ai: Ai.Interface,
        private editors: ReviewTargetEditorService.Interface,
        private tools: WorkflowAiToolRegistryService.Interface,
        private staleCheck: StepRunStaleCheckService.Interface,
        private logger: Logger.Interface
    ) {}

    public maxIterationsReason(): string {
        // The AI task is one iteration (A56): the ceiling is never reached.
        return this.failureReasons.error;
    }

    public getActor(requester: Actor): Actor {
        return getAiActor(requester);
    }

    public async run(params: StepRunner.Params): Promise<StepRunner.Outcome> {
        const { review, step, requester, task, iteration, signal } = params;
        const logFields = { taskId: task.id, reviewId: review.id, stepId: step.id };

        try {
            // 1. One iteration only; the handler refuses a re-entered task too (R170).
            if (iteration > 1) {
                this.logger.info(
                    { ...logFields, iteration },
                    "Refused to run an AI review task again."
                );
                throw new StepRunFailure(this.failureReasons.error);
            }

            // 2. The handler fires the signal at once when the remaining runtime is nearly gone.
            if (signal.aborted) {
                throw new StepRunFailure(AI_REVIEW_TIMED_OUT_REASON);
            }

            // 3. Everything comes from the review snapshot, never from the task input (R148).
            const config = aiStepConfigSchema.safeParse(step.config);
            if (!config.success) {
                throw new StepRunFailure(AI_STEP_INVALID_CONFIGURATION_REASON);
            }

            // 4. The tool set is the allowlist and nothing else (D55, Review Focus 2).
            // `Interface` defaults `TInput` to `unknown`, which is what `execute` below passes.
            const allowlisted: WorkflowAiTool.Interface[] = [];
            for (const name of config.data.tools) {
                const registered = this.tools.get(name);
                if (!registered) {
                    throw new StepRunFailure(aiToolNotAvailableReason(name));
                }
                if (!allowlisted.includes(registered)) {
                    allowlisted.push(registered);
                }
            }

            // 5. The capability and the model the author picked (R169). Logged as in the step
            // type's `reach`: a model that is not available is an expected typed state and a
            // disabled capability is a decision (D40), neither is logged; any other failure is
            // logged once here. The resolver logs nothing itself (an unreadable settings read is
            // this one log); only a failed read inside `ConfiguredAiModelsService` adds that
            // service's own log of the raw error, so that case logs twice.
            const resolved = await this.resolveCapability.execute(
                WORKFLOWS_REVIEW_CAPABILITY_ID,
                config.data.model
            );
            if (resolved.isFail()) {
                if (resolved.error instanceof AiModelNotAvailableError) {
                    throw new StepRunFailure(aiModelNotAvailableReason(config.data.model));
                }
                if (!(resolved.error instanceof AiCapabilityDisabledError)) {
                    this.logger.error(
                        { error: toLoggedAiError(resolved.error), ...logFields },
                        "Could not resolve the AI review capability."
                    );
                }
                // A disabled capability, unresolved settings, an unknown capability or a failed
                // model list read: one fixed text (D40). The raw message never reaches the step.
                throw new StepRunFailure(AI_CAPABILITY_NOT_AVAILABLE_REASON);
            }
            const capability = resolved.value;

            // 6. The target, from the snapshot (adapters log their real errors).
            const content = await this.editors.read({
                model: review.model,
                targetId: review.targetId,
                targetRevisionId: review.targetRevisionId
            });
            if (content.isFail()) {
                this.logger.info(
                    { ...logFields, reason: content.error.message },
                    "The AI review could not read the target."
                );
                throw new StepRunFailure(this.failureReasons.error);
            }

            // 7. The prompt and the input cap: never truncate (R175).
            const previousComments: AiStepPreviousComment[] = [];
            for (const earlier of review.steps) {
                if (earlier.id === step.id) {
                    break;
                }
                const comment = earlier.comment?.trim() ?? "";
                if (
                    (earlier.state === "approved" || earlier.state === "rejected") &&
                    comment !== ""
                ) {
                    previousComments.push({
                        stepTitle: earlier.title,
                        actor: earlier.owner?.displayName ?? "(no name)",
                        comment
                    });
                }
            }
            const prompt = buildAiStepPrompt({
                systemGuidance: capability.guidance,
                additionalInstructions: capability.additionalInstructions,
                instructions: config.data.instructions,
                content: content.value,
                previousComments
            });
            if (exceedsAiInputLimit(prompt)) {
                throw new StepRunFailure(AI_STEP_CONTENT_TOO_LARGE_MESSAGE);
            }

            // 8. The stale state of this call (R175, Review Focus 1): one closure per run holding
            // the throttle and the sticky flag. Its callers never overlap: tool calls run one at a
            // time through `toolChain` below, and the SDK evaluates `stopWhen` only after a step's
            // tool results are in.
            let stale = false;
            let lastStaleCheckAt: number | null = null;
            const checkStale = async (): Promise<boolean> => {
                if (stale) {
                    return true;
                }
                if (
                    lastStaleCheckAt !== null &&
                    Date.now() - lastStaleCheckAt < STEP_RUN_STALE_CHECK_INTERVAL_MS
                ) {
                    return false;
                }
                lastStaleCheckAt = Date.now();
                try {
                    const checked = await this.staleCheck.isStale({
                        reviewId: review.id,
                        stepId: step.id,
                        task
                    });
                    // A failed read is not stale: keep going (the service logged it).
                    if (checked.isOk() && checked.value) {
                        stale = true;
                    }
                } catch (error) {
                    // The service returns Results; a throw is unexpected. Not stale, logged once
                    // here, never handed to the AI SDK (R87).
                    this.logger.error(
                        { error: toLoggedAiError(error), ...logFields },
                        "Could not check whether the AI step is still running."
                    );
                }
                return stale;
            };

            // The AI SDK tool set, one entry per allowlisted tool (the shape `AiSdkTools` builds).
            // The context comes from the run, never from the model's input (Review Focus 2).
            let toolChain: Promise<void> = Promise.resolve();
            const toolSet: ToolSet = {};
            for (const workflowTool of allowlisted) {
                toolSet[workflowTool.name] = {
                    description: workflowTool.description,
                    inputSchema: workflowTool.inputSchema,
                    execute: (input: unknown) => {
                        // The SDK runs the tool calls of one model step in parallel, and a write
                        // tool reads the entry and writes a merged object: two at once lose one
                        // write. Each call waits for the previous one of this run. The chain
                        // never rejects, so one failing call cannot break it for the next.
                        const turn = toolChain.then(async () => {
                            if (await checkStale()) {
                                return { ok: false, error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE };
                            }
                            try {
                                return await workflowTool.execute(input, {
                                    review,
                                    step,
                                    requester,
                                    task
                                });
                            } catch (error) {
                                // A custom tool threw (R87): the SDK would show its raw message
                                // to the model.
                                this.logger.error(
                                    {
                                        error: toLoggedAiError(error),
                                        ...logFields,
                                        tool: workflowTool.name
                                    },
                                    "An AI tool threw."
                                );
                                return {
                                    ok: false,
                                    error: `The tool "${workflowTool.name}" failed.`
                                };
                            }
                        });
                        toolChain = turn.then(
                            () => undefined,
                            () => undefined
                        );
                        return turn;
                    }
                };
            }

            // 9. The call.
            let result: Awaited<ReturnType<Ai.Interface["generateText"]>> | undefined;
            let callError: unknown = null;
            try {
                result = await this.ai.generateText({
                    model: capability.model,
                    connection: capability.connection,
                    system: prompt.system,
                    prompt: prompt.user,
                    abortSignal: signal,
                    output: Output.object({ schema: aiReviewOutputSchema, name: "decision" }),
                    ...(allowlisted.length > 0
                        ? {
                              tools: toolSet,
                              stopWhen: [stepCountIs(AI_STEP_MAX_TOOL_STEPS), checkStale]
                          }
                        : {})
                });
            } catch (error) {
                callError = error;
            }

            // 10. A cancel or restart seen during the call wins over everything the call
            // produced, and is checked before any output is read: a stopped call has none (R175).
            if (stale) {
                throw new StepRunFailure(this.failureReasons.aborted);
            }

            // 11. A call that threw.
            if (!result) {
                if (signal.aborted) {
                    throw new StepRunFailure(AI_REVIEW_TIMED_OUT_REASON);
                }
                if (
                    NoObjectGeneratedError.isInstance(callError) ||
                    NoOutputGeneratedError.isInstance(callError)
                ) {
                    throw new StepRunFailure(AI_REVIEW_NO_DECISION_REASON);
                }
                this.logger.error(
                    { error: toLoggedAiError(callError), ...logFields },
                    "The AI review call failed."
                );
                throw new StepRunFailure(this.failureReasons.error);
            }

            // 12. The structured output.
            let output: unknown;
            try {
                output = result.output;
            } catch (error) {
                if (
                    NoOutputGeneratedError.isInstance(error) ||
                    NoObjectGeneratedError.isInstance(error)
                ) {
                    const last = result.steps[result.steps.length - 1];
                    const hitStepCap =
                        result.steps.length >= AI_STEP_MAX_TOOL_STEPS &&
                        (last?.toolCalls.length ?? 0) > 0;
                    throw new StepRunFailure(
                        hitStepCap
                            ? getAiStepLimitReason(AI_STEP_MAX_TOOL_STEPS)
                            : AI_REVIEW_NO_DECISION_REASON
                    );
                }
                throw error;
            }
            const decision = aiReviewOutputSchema.safeParse(output);
            if (!decision.success) {
                throw new StepRunFailure(AI_REVIEW_NO_DECISION_REASON);
            }

            // 13. The outcome (R171, D100). The handler applies it after its own re-guard.
            if (decision.data.issues.length > AI_STEP_MAX_ISSUES) {
                this.logger.info(
                    { ...logFields, count: decision.data.issues.length },
                    "Dropped the AI issues over the cap."
                );
            }
            const issues = normalizeAiIssues(decision.data.issues);
            const comment = decision.data.comment
                .trim()
                .slice(0, AI_STEP_MAX_COMMENT_LENGTH)
                .trim();
            if (decision.data.approved) {
                return comment === ""
                    ? { type: "approved", issues }
                    : { type: "approved", comment, issues };
            }
            if (comment.length < REJECT_COMMENT_MIN_LENGTH) {
                throw new StepRunFailure(AI_REVIEW_REJECTED_WITHOUT_COMMENT_REASON);
            }
            return { type: "rejected", comment, issues };
        } catch (error) {
            if (error instanceof StepRunFailure) {
                throw error;
            }
            // 14. Nothing but a `StepRunFailure` leaves this runner (R87).
            this.logger.error(
                { error: toLoggedAiError(error), ...logFields },
                "The AI review threw."
            );
            throw new StepRunFailure(this.failureReasons.error);
        }
    }
}

export const AiStepRunner = StepRunner.createImplementation({
    implementation: AiStepRunnerImpl,
    dependencies: [
        ResolveAiCapabilityUseCase,
        Ai,
        ReviewTargetEditorService,
        WorkflowAiToolRegistryService,
        StepRunStaleCheckService,
        Logger
    ]
});
