import { describe, expect, it } from "vitest";
import { z } from "zod";
import { Result } from "@webiny/feature/api";
import type { WorkflowAiTool } from "@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js";
import { StepRunFailure } from "@webiny/api-workflows/features/stepRun/StepRunFailure.js";
import { ReviewTargetEditorError } from "@webiny/api-workflows/domain/review/errors.js";
import { REJECT_COMMENT_MIN_LENGTH } from "@webiny/api-workflows/domain/review/Review.js";
import {
    AI_STEP_CONTENT_TOO_LARGE_MESSAGE,
    AI_STEP_MAX_INPUT_CHARACTERS
} from "@webiny/api-workflows/features/aiTools/constants.js";
import { AI_STEP_TYPE } from "@webiny/api-workflows/domain/workflow/stepTypes.js";
import {
    AiCapabilityDisabledError,
    AiModelNotAvailableError
} from "~/api/features/Capabilities/index.js";
import {
    AI_STEP_MAX_COMMENT_LENGTH,
    AI_STEP_MAX_ISSUES,
    AI_STEP_MAX_TOOL_STEPS,
    WORKFLOWS_REVIEW_CAPABILITY_ID
} from "~/api/features/WorkflowReview/constants.js";
import { buildAiStepPrompt } from "~/api/features/WorkflowReview/buildAiStepPrompt.js";
import { NoObjectGeneratedError, NoOutputGeneratedError } from "ai";
import { AI_MODEL, AI_STEP_ID, ARTICLE_MODEL, requester } from "~tests/__helpers/aiStepFixtures.js";
import { AI_REVIEW_ID, AI_TASK, createRunningAiReview } from "~tests/__helpers/aiRunReviews.js";
import { createResolvedCapability } from "~tests/__helpers/FakeResolveAiCapability.js";
import { RecordingAiTool } from "~tests/__helpers/RecordingAiTool.js";
import { APPROVE_DECISION } from "~tests/__helpers/ScriptedAi.js";

/** What the SDK hands a stop condition: the steps so far. */
interface StopConditionOptions {
    steps: object[];
}

/** A stop condition as the runner passes it to the SDK. */
type StopCondition = (options: StopConditionOptions) => boolean | PromiseLike<boolean>;
import { createAiStepRunnerHarness, GUIDANCE } from "~tests/__helpers/AiStepRunnerHarness.js";
import { createTargetContent } from "~tests/__helpers/ScriptedEditorService.js";

/** The reason of the `StepRunFailure` a promise rejects with; anything else rethrows. */
const failureOf = async (promise: Promise<unknown>): Promise<string> => {
    try {
        await promise;
    } catch (error) {
        if (error instanceof StepRunFailure) {
            return error.reason;
        }
        throw error;
    }
    throw new Error("The run did not fail.");
};

const createGenerateError = (): NoObjectGeneratedError => {
    return new NoObjectGeneratedError({
        message: "No object generated.",
        response: {} as never,
        usage: {} as never,
        finishReason: "stop"
    });
};

/**
 * A tool that records when each call starts and finishes into `events`, and holds every call for
 * a macrotask so an overlap would show; the call with the input `fail` throws.
 */
class SlowRecordingAiTool implements WorkflowAiTool.Interface {
    public readonly title = "slow";
    public readonly description = "Slow.";
    public readonly label = "Slow";
    public readonly summary = "Slow.";
    public readonly inputSchema = z.object({ value: z.string() });
    public readonly events: string[] = [];

    public constructor(public readonly name: string) {}

    public async execute(input: unknown): Promise<WorkflowAiTool.Result> {
        const value = (input as { value: string }).value;
        this.events.push(`start ${value}`);
        await new Promise(resolve => setTimeout(resolve, 20));
        this.events.push(`finish ${value}`);
        if (value === "fail") {
            throw new Error("The first call failed.");
        }
        return { ok: true, data: { value } };
    }
}

describe("AiStepRunner members (R168, R170)", () => {
    it("is the ai runner: single run, fixed reasons, the AI actor", () => {
        const { runner } = createAiStepRunnerHarness();

        expect(runner.type).toBe(AI_STEP_TYPE);
        expect(runner.singleRun).toBe(true);
        expect(runner.failureReasons).toEqual({
            error: "The AI review failed.",
            aborted: "The AI review was aborted.",
            stuck: "The AI review task ended without a result."
        });
        expect(runner.getActor(requester)).toEqual({
            type: "ai",
            id: requester.id,
            displayName: requester.displayName
        });
        expect(runner.maxIterationsReason(createRunningAiReview().steps[1])).toBe(
            "The AI review failed."
        );
    });
});

describe("AiStepRunner failures before the call (R170, R175)", () => {
    it("fails an iteration above 1 with the error reason and makes no model call", async () => {
        const { run, ai, resolver, logger } = createAiStepRunnerHarness();

        const reason = await failureOf(run({ iteration: 2 }));

        expect(reason).toBe("The AI review failed.");
        expect(ai.calls).toHaveLength(0);
        expect(resolver.calls).toHaveLength(0);
        expect(logger.infos).toHaveLength(1);
    });

    it("runs iteration 1", async () => {
        const { run, ai } = createAiStepRunnerHarness();

        await run({ iteration: 1 });

        expect(ai.calls).toHaveLength(1);
    });

    it("fails with the timeout reason when the signal is already aborted, no model call (R175)", async () => {
        const { run, ai, resolver } = createAiStepRunnerHarness();
        const controller = new AbortController();
        controller.abort();

        const reason = await failureOf(run({ signal: controller.signal }));

        expect(reason).toBe("The AI review timed out.");
        expect(ai.calls).toHaveLength(0);
        expect(resolver.calls).toHaveLength(0);
    });

    it("fails when the step config no longer parses", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ config: { instructions: 1, model: AI_MODEL } })
        });

        const reason = await failureOf(run());

        expect(reason).toBe("The AI step configuration is not valid.");
        expect(ai.calls).toHaveLength(0);
    });

    it("fails when an allowlisted tool is no longer registered", async () => {
        const { run, ai, resolver } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo", "ghost"] }),
            tools: [new RecordingAiTool("echo")]
        });

        const reason = await failureOf(run());

        expect(reason).toBe('The AI tool "ghost" is not available.');
        expect(ai.calls).toHaveLength(0);
        expect(resolver.calls).toHaveLength(0);
    });

    it("resolves the capability with the capability id and the model of the step", async () => {
        const { run, resolver } = createAiStepRunnerHarness({
            review: createRunningAiReview({ model: "openai/gpt-5" })
        });

        await run();

        expect(resolver.calls).toEqual([
            { capabilityId: WORKFLOWS_REVIEW_CAPABILITY_ID, model: "openai/gpt-5" }
        ]);
    });

    it.each([
        {
            name: "a disabled capability",
            error: new AiCapabilityDisabledError(
                WORKFLOWS_REVIEW_CAPABILITY_ID,
                "Workflow review",
                "Settings → AI Power-Ups"
            ),
            reason: "The AI review capability is not available.",
            logged: 0
        },
        {
            name: "a model without a connection",
            error: new AiModelNotAvailableError(AI_MODEL),
            reason: `The model "${AI_MODEL}" is not available.`,
            logged: 0
        },
        {
            name: "settings that could not be loaded",
            error: new Error("Failed to load AI Power-Ups settings."),
            reason: "The AI review capability is not available.",
            logged: 1
        },
        {
            name: "a failed model list read",
            error: new Error("Failed to list the configured AI models."),
            reason: "The AI review capability is not available.",
            logged: 1
        }
    ])(
        "maps $name to its fixed reason and makes no call; $logged error log(s)",
        async ({ error, reason, logged }) => {
            const { run, resolver, ai, logger } = createAiStepRunnerHarness();
            resolver.result = Result.fail(error);

            const failed = await failureOf(run());

            expect(failed).toBe(reason);
            expect(ai.calls).toHaveLength(0);
            // A typed, expected state (model) and a decision (disabled) are not logged; anything else
            // is, once, with the raw error (the same split as Task 17's `reach`).
            expect(logger.errors).toHaveLength(logged);
            expect(logger.infos).toHaveLength(0);
            if (logged > 0) {
                expect(logger.errors[0].message).toBe(
                    "Could not resolve the AI review capability."
                );
                expect(logger.errors[0].fields).toMatchObject({
                    error: { name: error.name, message: error.message },
                    reviewId: AI_REVIEW_ID,
                    stepId: AI_STEP_ID,
                    taskId: AI_TASK.id
                });
            }
            // The raw text never reaches the step.
            expect(failed).not.toContain("Failed to");
        }
    );

    it("fails with the error reason and logs once when the resolver throws", async () => {
        const { run, resolver, ai, logger } = createAiStepRunnerHarness();
        resolver.failure = new Error("The key could not be decrypted: kms-secret-7");

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review failed.");
        expect(reason).not.toContain("kms-secret");
        expect(ai.calls).toHaveLength(0);
        expect(logger.errors).toHaveLength(1);
    });

    it("reads the target with the ids of the review snapshot, never anything from the config", async () => {
        const { run, editor } = createAiStepRunnerHarness();

        await run();

        expect(editor.readCalls).toEqual([
            {
                model: ARTICLE_MODEL,
                targetId: "article-1",
                targetRevisionId: "article-1#0001"
            }
        ]);
    });

    it("fails with the error reason, and no model call, when the target cannot be read", async () => {
        const { run, editor, ai, logger } = createAiStepRunnerHarness();
        editor.content = Result.fail(new ReviewTargetEditorError("The target was not found."));

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review failed.");
        expect(ai.calls).toHaveLength(0);
        expect(logger.infos).toHaveLength(1);
        expect(logger.errors).toHaveLength(0);
    });

    it("fails an oversized target with the too-large reason and nothing is sent to the model (R175)", async () => {
        const { run, editor, ai } = createAiStepRunnerHarness();
        const content = createTargetContent();
        content.fields[1].value = "x".repeat(AI_STEP_MAX_INPUT_CHARACTERS + 1);
        editor.content = Result.ok(content);

        const reason = await failureOf(run());

        expect(reason).toBe(AI_STEP_CONTENT_TOO_LARGE_MESSAGE);
        expect(reason).toBe("The content is too large for the AI review.");
        expect(ai.calls).toHaveLength(0);
    });
});

describe("AiStepRunner model call (R171, R174, R175)", () => {
    it("calls the model with the resolved model and connection, the built prompt and the signal", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        const controller = new AbortController();

        await run({ signal: controller.signal });

        expect(ai.calls).toHaveLength(1);
        const call = ai.calls[0];
        const expected = buildAiStepPrompt({
            systemGuidance: GUIDANCE,
            additionalInstructions: "",
            instructions: "Check the tone.",
            content: createTargetContent(),
            previousComments: [
                { stepTitle: "Legal", actor: "Lena Legal", comment: "Cleared by legal." }
            ]
        });
        expect(call.model).toBe(AI_MODEL);
        expect(call.connection).toEqual(createResolvedCapability(AI_MODEL).connection);
        expect(call.system).toBe(expected.system);
        expect(call.prompt).toBe(expected.user);
        expect(call.abortSignal).toBe(controller.signal);
        expect(call.output).toBeDefined();
    });

    it("calls the model the resolution chose, not the one in the step config", async () => {
        const { run, ai, resolver } = createAiStepRunnerHarness();
        const fallback = {
            ...createResolvedCapability("anthropic/standard-model"),
            fellBackToStandard: true
        };
        resolver.result = Result.ok(fallback);

        await run();

        expect(ai.calls[0].model).toBe("anthropic/standard-model");
        expect(ai.calls[0].model).not.toBe(AI_MODEL);
        expect(ai.calls[0].connection).toEqual(fallback.connection);
    });

    it("appends the project instructions to the system prompt", async () => {
        const { run, ai, resolver } = createAiStepRunnerHarness();
        resolver.result = Result.ok({
            ...createResolvedCapability(AI_MODEL),
            additionalInstructions: "Always answer in French."
        });

        await run();

        expect(String(ai.calls[0].system)).toContain("Always answer in French.");
    });

    it("sends only earlier approved or rejected comments, not a failed step's reason", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({
                previousStep: { state: "failed", comment: "The automation failed." }
            })
        });

        await run();

        expect(String(ai.calls[0].prompt)).not.toContain("previous-step-comments");
        expect(String(ai.calls[0].prompt)).not.toContain("The automation failed.");
    });

    it("labels the author of a comment from a step without an owner as (no name), not Unknown", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({
                previousStep: { state: "approved", comment: "Cleared.", owner: null }
            })
        });

        await run();

        expect(String(ai.calls[0].prompt)).toContain('"by":"(no name)"');
        expect(String(ai.calls[0].prompt)).not.toContain("Unknown");
    });

    it("leaves out the comments block when the AI step is the first step", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ previousStep: null })
        });

        await run();

        expect(String(ai.calls[0].prompt)).not.toContain("previous-step-comments");
    });

    it("passes no tools and no stop conditions when the step allowlists none", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            tools: [new RecordingAiTool("echo")]
        });

        await run();

        expect(ai.calls[0].tools).toBeUndefined();
        expect(ai.calls[0].stopWhen).toBeUndefined();
    });

    it("offers exactly the allowlisted tools; a registered tool the step does not allowlist is absent (Review Focus 2)", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo"] }),
            tools: [new RecordingAiTool("echo"), new RecordingAiTool("other")]
        });

        await run();

        expect(Object.keys(ai.calls[0].tools ?? {})).toEqual(["echo"]);
    });

    it("collapses a duplicated allowlist name to one tool", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo", "echo"] }),
            tools: [new RecordingAiTool("echo")]
        });

        await run();

        expect(Object.keys(ai.calls[0].tools ?? {})).toEqual(["echo"]);
    });

    it("passes the step cap and the stale stop as stop conditions when there are tools", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo"] }),
            tools: [new RecordingAiTool("echo")]
        });

        await run();

        const stopWhen = ai.calls[0].stopWhen as StopCondition[];
        expect(stopWhen).toHaveLength(2);
        const [stepCap, staleStop] = stopWhen;
        const steps = (count: number) => ({ steps: Array.from({ length: count }, () => ({})) });
        // The cap stops at exactly AI_STEP_MAX_TOOL_STEPS steps.
        expect(await stepCap(steps(AI_STEP_MAX_TOOL_STEPS - 1))).toBe(false);
        expect(await stepCap(steps(AI_STEP_MAX_TOOL_STEPS))).toBe(true);
        // The other is the stale stop: a current review never stops, whatever the step count.
        expect(await staleStop(steps(AI_STEP_MAX_TOOL_STEPS))).toBe(false);
    });

    it("runs a tool with the context of the run and exactly the input the model sent", async () => {
        const echo = new RecordingAiTool("echo");
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo"] }),
            tools: [echo]
        });
        ai.response = {
            steps: [{ toolCalls: [{ name: "echo", input: { value: "hello" } }] }],
            decision: APPROVE_DECISION
        };

        await run();

        expect(echo.calls).toHaveLength(1);
        expect(echo.calls[0].input).toEqual({ value: "hello" });
        const review = createRunningAiReview({ tools: ["echo"] });
        expect(echo.calls[0].context).toEqual({
            review,
            step: review.steps.find(step => step.id === AI_STEP_ID),
            requester,
            task: AI_TASK
        });
        expect(echo.calls[0].context.review.id).toBe(AI_REVIEW_ID);
    });

    it("gives the tool result back to the model unchanged", async () => {
        const echo = new RecordingAiTool("echo");
        echo.result = { ok: false, error: "The field is read-only." };
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo"] }),
            tools: [echo]
        });
        ai.response = {
            steps: [{ toolCalls: [{ name: "echo", input: { value: "a" } }] }],
            decision: APPROVE_DECISION
        };

        await run();

        expect(ai.toolResults).toEqual([
            {
                name: "echo",
                input: { value: "a" },
                result: { ok: false, error: "The field is read-only." }
            }
        ]);
    });

    it("answers a throwing tool with a fixed text, logs the raw error and keeps going", async () => {
        const echo = new RecordingAiTool("echo");
        echo.failure = new Error("EACCES: /secret/path key=sk-123");
        const { run, ai, logger } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo"] }),
            tools: [echo]
        });
        ai.response = {
            steps: [{ toolCalls: [{ name: "echo", input: { value: "a" } }] }],
            decision: APPROVE_DECISION
        };

        const outcome = await run();

        expect(ai.toolResults[0].result).toEqual({
            ok: false,
            error: 'The tool "echo" failed.'
        });
        expect(JSON.stringify(ai.toolResults)).not.toContain("sk-123");
        expect(logger.errors).toHaveLength(1);
        expect(logger.errors[0].fields).toMatchObject({ reviewId: AI_REVIEW_ID, tool: "echo" });
        expect(outcome.type).toBe("approved");
    });
});

describe("AiStepRunner outcome mapping (R171, D100)", () => {
    it("approves without a comment: the comment is left out", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: { approved: true, comment: "   ", issues: [] }
        };

        const outcome = await run();

        expect(outcome).toEqual({ type: "approved", issues: [] });
        expect("comment" in outcome).toBe(false);
    });

    it("approves with the trimmed comment and the issues", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: {
                approved: true,
                comment: "  Looks good.  ",
                issues: [
                    {
                        fieldPath: "bio",
                        severity: "info",
                        message: "Could be longer.",
                        suggestion: null
                    }
                ]
            }
        };

        const outcome = await run();

        expect(outcome).toEqual({
            type: "approved",
            comment: "Looks good.",
            issues: [
                {
                    fieldPath: "bio",
                    severity: "info",
                    message: "Could be longer.",
                    suggestion: null
                }
            ]
        });
    });

    it("rejects with the trimmed comment and the issues", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: {
                approved: false,
                comment: "  The title is misleading.  ",
                issues: [
                    {
                        fieldPath: "name",
                        severity: "error",
                        message: "Misleading.",
                        suggestion: "Rename it."
                    }
                ]
            }
        };

        const outcome = await run();

        expect(outcome).toEqual({
            type: "rejected",
            comment: "The title is misleading.",
            issues: [
                {
                    fieldPath: "name",
                    severity: "error",
                    message: "Misleading.",
                    suggestion: "Rename it."
                }
            ]
        });
    });

    it("accepts a reject comment of exactly the minimum length", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: {
                approved: false,
                comment: "c".repeat(REJECT_COMMENT_MIN_LENGTH),
                issues: []
            }
        };

        const outcome = await run();

        expect(outcome.type).toBe("rejected");
    });

    it.each([
        { name: "an empty comment", comment: "" },
        { name: "a blank comment", comment: "          " },
        {
            name: "a comment one character short",
            comment: "c".repeat(REJECT_COMMENT_MIN_LENGTH - 1)
        },
        {
            name: "a comment that is short once trimmed",
            comment: `   ${"c".repeat(REJECT_COMMENT_MIN_LENGTH - 1)}   `
        }
    ])("fails a rejection with $name", async ({ comment }) => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = { steps: [], decision: { approved: false, comment, issues: [] } };

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review rejected without a comment.");
    });

    it("clamps the issues and strips the keys the model added", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: {
                approved: true,
                comment: "",
                issues: [
                    {
                        fieldPath: "p".repeat(600),
                        severity: "warning",
                        message: "m".repeat(2500),
                        suggestion: "s".repeat(2500),
                        confidence: "high"
                    }
                ]
            }
        };

        const outcome = await run();

        expect(outcome).toEqual({
            type: "approved",
            issues: [
                {
                    fieldPath: "p".repeat(500),
                    severity: "warning",
                    message: "m".repeat(2000),
                    suggestion: "s".repeat(2000)
                }
            ]
        });
    });

    it("keeps at most the issue cap and logs once that extras were dropped", async () => {
        const { run, ai, logger } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: {
                approved: true,
                comment: "",
                issues: Array.from({ length: AI_STEP_MAX_ISSUES + 5 }, (_, index) => {
                    return {
                        fieldPath: null,
                        severity: "info",
                        message: `issue ${index}`,
                        suggestion: null
                    };
                })
            }
        };

        const outcome = await run();

        expect(outcome).toMatchObject({ type: "approved" });
        expect((outcome as { issues: unknown[] }).issues).toHaveLength(AI_STEP_MAX_ISSUES);
        expect(logger.infos).toHaveLength(1);
        expect(logger.infos[0].fields).toMatchObject({ count: AI_STEP_MAX_ISSUES + 5 });
    });

    it("never returns continue and never writes (the editor refuses update)", async () => {
        const { run, ai, editor } = createAiStepRunnerHarness();
        ai.response = { steps: [], decision: APPROVE_DECISION };

        const outcome = await run();

        // The fake editor throws on update, so an approved outcome proves nothing was written.
        expect(outcome.type).toBe("approved");
        expect(editor.readCalls).toHaveLength(1);
    });
});

describe("AiStepRunner decision and call failures (R170, R175)", () => {
    it.each([
        { name: "no output", decision: null },
        { name: "an empty object", decision: {} },
        { name: "a non-boolean approved", decision: { approved: "yes", comment: "", issues: [] } },
        { name: "no issues list", decision: { approved: true, comment: "" } },
        {
            name: "an unknown severity",
            decision: {
                approved: true,
                comment: "",
                issues: [{ fieldPath: null, severity: "fatal", message: "m", suggestion: null }]
            }
        },
        { name: "a string", decision: "approved" }
    ])("fails with no decision for $name", async ({ decision }) => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = { steps: [], decision };

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review returned no decision.");
    });

    it("fails with the step-cap reason when the tool loop hit its cap without a decision", async () => {
        const echo = new RecordingAiTool("echo");
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo"] }),
            tools: [echo]
        });
        ai.response = {
            steps: Array.from({ length: AI_STEP_MAX_TOOL_STEPS }, () => {
                return { toolCalls: [{ name: "echo", input: { value: "again" } }] };
            }),
            decision: APPROVE_DECISION
        };

        const reason = await failureOf(run());

        expect(reason).toBe(`The AI review did not finish in ${AI_STEP_MAX_TOOL_STEPS} steps.`);
        expect(reason).toBe("The AI review did not finish in 20 steps.");
        expect(echo.calls).toHaveLength(AI_STEP_MAX_TOOL_STEPS);
    });

    it("fails with no decision when the SDK reports no object", async () => {
        const { run, ai, logger } = createAiStepRunnerHarness();
        ai.response = { steps: [], decision: APPROVE_DECISION, error: createGenerateError() };

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review returned no decision.");
        expect(logger.errors).toHaveLength(0);
    });

    it("fails with no decision when the SDK reports no output", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: APPROVE_DECISION,
            error: new NoOutputGeneratedError()
        };

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review returned no decision.");
    });

    it("fails with the fixed error reason for a provider failure and logs the error once, the key redacted", async () => {
        const { run, ai, logger } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: APPROVE_DECISION,
            error: new Error("401 invalid x-api-key sk-secret-123")
        };

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review failed.");
        expect(reason).not.toContain("sk-secret");
        expect(logger.errors).toHaveLength(1);
        const logged = logger.errors[0].fields.error as { message: string };
        expect(logged.message).toBe("401 invalid x-api-key [redacted]");
        expect(JSON.stringify(logger.errors[0].fields)).not.toContain("sk-secret");
        expect(logger.errors[0].fields).toMatchObject({
            reviewId: AI_REVIEW_ID,
            taskId: AI_TASK.id
        });
    });

    it("fails with the timeout reason when the signal fires during the call, without an error log", async () => {
        const { run, ai, logger } = createAiStepRunnerHarness();
        const controller = new AbortController();
        ai.response = {
            steps: [{ toolCalls: [], before: () => controller.abort() }],
            decision: APPROVE_DECISION
        };

        const reason = await failureOf(run({ signal: controller.signal }));

        expect(reason).toBe("The AI review timed out.");
        expect(logger.errors).toHaveLength(0);
    });

    it("fails with the fixed error reason when something unexpected throws in the runner", async () => {
        const { run, editor, logger } = createAiStepRunnerHarness();
        editor.read = async () => {
            throw new Error("Connection reset: password=hunter2");
        };

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review failed.");
        expect(reason).not.toContain("hunter2");
        expect(logger.errors).toHaveLength(1);
    });
});

describe("AiStepRunner serialises the tool calls of a run (I-3)", () => {
    it("runs two parallel calls of one step one after the other", async () => {
        const slow = new SlowRecordingAiTool("slow");
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["slow"] }),
            tools: [slow]
        });
        ai.response = {
            steps: [
                {
                    toolCalls: [
                        { name: "slow", input: { value: "a" } },
                        { name: "slow", input: { value: "b" } }
                    ]
                }
            ],
            decision: APPROVE_DECISION
        };

        await run();

        expect(slow.events).toEqual(["start a", "finish a", "start b", "finish b"]);
        expect(ai.toolResults.map(item => item.result)).toEqual([
            { ok: true, data: { value: "a" } },
            { ok: true, data: { value: "b" } }
        ]);
    });

    it("runs the second call after a first call that threw, with the fixed text for the first", async () => {
        const slow = new SlowRecordingAiTool("slow");
        const { run, ai, logger } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["slow"] }),
            tools: [slow]
        });
        ai.response = {
            steps: [
                {
                    toolCalls: [
                        { name: "slow", input: { value: "fail" } },
                        { name: "slow", input: { value: "b" } }
                    ]
                }
            ],
            decision: APPROVE_DECISION
        };

        const outcome = await run();

        expect(slow.events).toEqual(["start fail", "finish fail", "start b", "finish b"]);
        expect(ai.toolResults.map(item => item.result)).toEqual([
            { ok: false, error: 'The tool "slow" failed.' },
            { ok: true, data: { value: "b" } }
        ]);
        expect(logger.errors).toHaveLength(1);
        expect(outcome.type).toBe("approved");
    });
});

describe("AiStepRunner logs errors without the request (I-4)", () => {
    it("logs name, message and status code of a provider error, not the request or the headers", async () => {
        const { run, ai, logger } = createAiStepRunnerHarness();
        const providerError = Object.assign(new Error("Unauthorized"), {
            name: "AI_APICallError",
            statusCode: 401,
            requestBodyValues: { prompt: "the whole entry content" },
            responseHeaders: { "x-request-id": "abc", authorization: "Bearer sk-secret-1" },
            cause: new Error("socket")
        });
        ai.response = { steps: [], decision: APPROVE_DECISION, error: providerError };

        await failureOf(run());

        expect(logger.errors).toHaveLength(1);
        expect(logger.errors[0].message).toBe("The AI review call failed.");
        expect(logger.errors[0].fields.error).toEqual({
            name: "AI_APICallError",
            message: "Unauthorized",
            statusCode: 401
        });
        expect(JSON.stringify(logger.errors[0].fields)).not.toContain("sk-secret-1");
        expect(JSON.stringify(logger.errors[0].fields)).not.toContain("the whole entry content");
    });
});

describe("AiStepRunner caps the decision comment (Minor 5)", () => {
    it("stores a 6000 character comment as 5000 characters", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: { approved: true, comment: "c".repeat(6000), issues: [] }
        };

        const outcome = await run();

        expect(outcome).toMatchObject({ type: "approved" });
        expect((outcome as { comment: string }).comment).toHaveLength(AI_STEP_MAX_COMMENT_LENGTH);
        expect(AI_STEP_MAX_COMMENT_LENGTH).toBe(5000);
    });

    it("caps a reject comment too", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: { approved: false, comment: "c".repeat(6000), issues: [] }
        };

        const outcome = await run();

        expect((outcome as { comment: string }).comment).toHaveLength(AI_STEP_MAX_COMMENT_LENGTH);
    });
});
