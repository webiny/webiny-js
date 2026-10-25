import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { StepRunFailure } from "@webiny/api-workflows/features/stepRun/StepRunFailure.js";
import { STEP_RUN_STALE_CHECK_INTERVAL_MS } from "@webiny/api-workflows/features/stepRun/constants.js";
import { AI_TOOL_STEP_NOT_RUNNING_MESSAGE } from "@webiny/api-workflows/features/aiTools/constants.js";
import { AI_STEP_ID } from "~tests/__helpers/aiStepFixtures.js";
import {
    AI_REVIEW_ID,
    AI_TASK,
    cancelStoredReview,
    createRunningAiReview,
    restartStoredStep
} from "~tests/__helpers/aiRunReviews.js";
import { RecordingAiTool } from "~tests/__helpers/RecordingAiTool.js";
import { APPROVE_DECISION } from "~tests/__helpers/ScriptedAi.js";
import { createAiStepRunnerHarness } from "~tests/__helpers/AiStepRunnerHarness.js";
import type { ScriptedStep } from "~tests/__helpers/ScriptedAi.js";

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

const echoStep = (before?: ScriptedStep["before"]): ScriptedStep => {
    return { before, toolCalls: [{ name: "echo", input: { value: "x" } }] };
};

const advance = (milliseconds: number) => () => {
    vi.advanceTimersByTime(milliseconds);
};

const createStaleHarness = () => {
    const echo = new RecordingAiTool("echo");
    const harness = createAiStepRunnerHarness({
        review: createRunningAiReview({ tools: ["echo"] }),
        tools: [echo]
    });
    return { ...harness, echo };
};

describe("AiStepRunner stale check (R175, A56, Review Focus 1)", () => {
    beforeEach(() => {
        // Only `Date` is faked: the runner reads `Date.now()` for its throttle.
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2026-10-14T10:00:00.000Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("throttle: one read per interval", () => {
        it("reads once for every check inside one interval, with the task identity", async () => {
            const { run, ai, staleCheck } = createStaleHarness();
            // Three tool steps: six checks (a tool execute and a stop condition each) at one instant.
            ai.response = {
                steps: [echoStep(), echoStep(), echoStep()],
                decision: APPROVE_DECISION
            };

            await run();

            expect(staleCheck.calls).toEqual([
                { reviewId: AI_REVIEW_ID, stepId: AI_STEP_ID, task: AI_TASK }
            ]);
        });

        it("does not read again one millisecond before the interval ends", async () => {
            const { run, ai, staleCheck } = createStaleHarness();
            ai.response = {
                steps: [echoStep(), echoStep(advance(STEP_RUN_STALE_CHECK_INTERVAL_MS - 1))],
                decision: APPROVE_DECISION
            };

            await run();

            expect(staleCheck.calls).toHaveLength(1);
        });

        it("reads again once the interval has passed", async () => {
            const { run, ai, staleCheck } = createStaleHarness();
            ai.response = {
                steps: [echoStep(), echoStep(advance(STEP_RUN_STALE_CHECK_INTERVAL_MS))],
                decision: APPROVE_DECISION
            };

            await run();

            expect(staleCheck.calls).toHaveLength(2);
        });

        it("reads again after every further interval", async () => {
            const { run, ai, staleCheck } = createStaleHarness();
            ai.response = {
                steps: [
                    echoStep(),
                    echoStep(advance(STEP_RUN_STALE_CHECK_INTERVAL_MS)),
                    echoStep(advance(STEP_RUN_STALE_CHECK_INTERVAL_MS)),
                    echoStep()
                ],
                decision: APPROVE_DECISION
            };

            await run();

            expect(staleCheck.calls).toHaveLength(3);
        });

        it("makes no read when the step has no tools (nothing can ask)", async () => {
            const { run, ai, staleCheck } = createAiStepRunnerHarness({
                tools: [new RecordingAiTool("echo")]
            });
            ai.response = { steps: [], decision: APPROVE_DECISION };

            await run();

            expect(staleCheck.calls).toHaveLength(0);
        });
    });

    describe("sticky: once stale, always stale", () => {
        it("keeps answering stale without reading again, even once the stored review is current again and the interval has passed", async () => {
            const { run, ai, staleCheck, store, echo } = createStaleHarness();
            const current = store.review;
            // Right after the read that sees the cancel, the stored review is put back and the clock
            // moves past the interval, before the step's second tool call checks.
            staleCheck.afterRead = stale => {
                if (stale) {
                    store.review = current;
                    vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS * 2);
                }
            };
            ai.response = {
                steps: [
                    echoStep(),
                    {
                        before: () => {
                            store.review = cancelStoredReview(current);
                            vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                        },
                        toolCalls: [
                            { name: "echo", input: { value: "a" } },
                            { name: "echo", input: { value: "b" } }
                        ]
                    }
                ],
                decision: APPROVE_DECISION
            };

            const reason = await failureOf(run());

            expect(reason).toBe("The AI review was aborted.");
            // The first step's read and the one that saw the cancel; none for the second call or
            // the stop condition, though a read then would have answered "current".
            expect(staleCheck.calls).toHaveLength(2);
            expect(echo.calls).toHaveLength(1);
            expect(ai.toolResults.slice(1).map(entry => entry.result)).toEqual([
                { ok: false, error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE },
                { ok: false, error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE }
            ]);
        });

        it("answers stale to every later tool call of the same step without another read", async () => {
            const { run, ai, staleCheck, store, echo } = createStaleHarness();
            const current = store.review;
            // Two tool calls in the second step: the first sees stale, the second must too.
            ai.response = {
                steps: [
                    echoStep(),
                    {
                        before: () => {
                            store.review = cancelStoredReview(current);
                            vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                        },
                        toolCalls: [
                            { name: "echo", input: { value: "a" } },
                            { name: "echo", input: { value: "b" } }
                        ]
                    }
                ],
                decision: APPROVE_DECISION
            };

            await failureOf(run());

            expect(staleCheck.calls).toHaveLength(2);
            expect(echo.calls).toHaveLength(1);
            const refused = ai.toolResults.slice(1);
            expect(refused).toHaveLength(2);
            for (const entry of refused) {
                expect(entry.result).toEqual({
                    ok: false,
                    error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE
                });
            }
        });
    });

    describe("a cancel or restart during the call stops it and writes nothing", () => {
        it("stops the call and writes nothing when the stored review is cancelled during the call", async () => {
            const { run, ai, store, echo, staleCheck } = createStaleHarness();
            const current = store.review;
            ai.response = {
                steps: [
                    echoStep(),
                    echoStep(() => {
                        store.review = cancelStoredReview(current);
                        vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                    }),
                    echoStep()
                ],
                decision: APPROVE_DECISION
            };

            const reason = await failureOf(run());

            expect(reason).toBe("The AI review was aborted.");
            // The first call ran its tool; the second was refused before the tool ran; no third.
            expect(echo.calls).toHaveLength(1);
            expect(ai.toolResults).toHaveLength(2);
            expect(ai.toolResults[1].result).toEqual({
                ok: false,
                error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE
            });
            expect(ai.calls).toHaveLength(1);
            expect(staleCheck.calls).toHaveLength(2);
        });

        it("stops the call and writes nothing when the step is restarted under another task during the call", async () => {
            const { run, ai, store, echo } = createStaleHarness();
            const current = store.review;
            ai.response = {
                steps: [
                    echoStep(),
                    echoStep(() => {
                        store.review = restartStoredStep(current, "task-2");
                        vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                    }),
                    echoStep()
                ],
                decision: APPROVE_DECISION
            };

            const reason = await failureOf(run());

            expect(reason).toBe("The AI review was aborted.");
            expect(echo.calls).toHaveLength(1);
            expect(ai.toolResults[1].result).toEqual({
                ok: false,
                error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE
            });
        });

        it("does not see a flip made inside the same interval (the throttle, A56: up to one interval late)", async () => {
            const { run, ai, store, echo } = createStaleHarness();
            const current = store.review;
            ai.response = {
                steps: [
                    echoStep(),
                    echoStep(() => {
                        store.review = cancelStoredReview(current);
                    })
                ],
                decision: APPROVE_DECISION
            };

            const outcome = await run();

            expect(outcome.type).toBe("approved");
            expect(echo.calls).toHaveLength(2);
        });

        it("does not stop a call that already reached its decision step: the handler's post-run guard refuses it", async () => {
            const { run, ai, store, echo } = createStaleHarness();
            const current = store.review;
            ai.response = {
                steps: [
                    echoStep(),
                    {
                        before: () => {
                            store.review = cancelStoredReview(current);
                            vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                        },
                        // A step with no tool calls asks no stop condition; the call ends with a decision.
                        toolCalls: []
                    }
                ],
                decision: APPROVE_DECISION
            };

            const outcome = await run();

            // No tool call and no stop condition ran after the flip (a step without tool calls asks
            // none): the decision stands here, and the handler's post-run guard refuses to apply
            // it to the cancelled review (Task 4).
            expect(outcome.type).toBe("approved");
            expect(echo.calls).toHaveLength(1);
        });

        it("checks the stale flag before reading the output when the call throws", async () => {
            const { run, ai, store, logger } = createStaleHarness();
            const current = store.review;
            ai.response = {
                steps: [
                    echoStep(),
                    {
                        ...echoStep(() => {
                            store.review = cancelStoredReview(current);
                            vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                        }),
                        fail: new Error("The provider dropped the connection.")
                    }
                ],
                decision: APPROVE_DECISION
            };

            const reason = await failureOf(run());

            expect(reason).toBe("The AI review was aborted.");
            // A stale stop is not a failure to report: no error log.
            expect(logger.errors).toHaveLength(0);
        });

        it("keeps the stale reason ahead of the timeout reason when the call throws after both", async () => {
            const { run, ai, store } = createStaleHarness();
            const current = store.review;
            const controller = new AbortController();
            ai.response = {
                steps: [
                    echoStep(),
                    {
                        before: () => {
                            store.review = cancelStoredReview(current);
                            vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                        },
                        toolCalls: [{ name: "echo", input: { value: "x" } }],
                        // Read after the step's tool calls: the signal fires and the call throws.
                        get fail() {
                            controller.abort();
                            return new Error("This operation was aborted.");
                        }
                    }
                ],
                decision: APPROVE_DECISION
            };

            const reason = await failureOf(run({ signal: controller.signal }));

            expect(controller.signal.aborted).toBe(true);
            expect(reason).toBe("The AI review was aborted.");
        });
    });

    describe("a failed read counts as not stale", () => {
        it("keeps the call going, runs the tools and approves; the runner logs nothing (the service did)", async () => {
            const { run, ai, staleCheck, echo, logger } = createStaleHarness();
            staleCheck.failure = new ReviewPersistenceError(new Error("Storage is down."));
            ai.response = {
                steps: [echoStep(), echoStep(advance(STEP_RUN_STALE_CHECK_INTERVAL_MS))],
                decision: APPROVE_DECISION
            };

            const outcome = await run();

            expect(outcome.type).toBe("approved");
            expect(echo.calls).toHaveLength(2);
            expect(logger.logs).toEqual([]);
        });

        it("treats a throwing read as not stale: the tools run, one error log, nothing reaches the model", async () => {
            const { run, ai, staleCheck, echo, logger } = createStaleHarness();
            staleCheck.throws = new Error("Unexpected stale check failure.");
            ai.response = { steps: [echoStep()], decision: APPROVE_DECISION };

            const outcome = await run();

            expect(outcome.type).toBe("approved");
            expect(echo.calls).toHaveLength(1);
            expect(logger.logs).toHaveLength(1);
            expect(logger.logs[0]).toMatchObject({
                level: "error",
                message: "Could not check whether the AI step is still running."
            });
        });

        it("still throttles: a failed read uses its slot of the interval", async () => {
            const { run, ai, staleCheck } = createStaleHarness();
            staleCheck.failure = new ReviewPersistenceError(new Error("Storage is down."));
            ai.response = {
                steps: [echoStep(), echoStep(), echoStep()],
                decision: APPROVE_DECISION
            };

            await run();

            expect(staleCheck.calls).toHaveLength(1);
        });

        it("stops on a later read that succeeds and says stale", async () => {
            const { run, ai, staleCheck, store, echo } = createStaleHarness();
            const current = store.review;
            staleCheck.failure = new ReviewPersistenceError(new Error("Storage is down."));
            ai.response = {
                steps: [
                    echoStep(),
                    echoStep(() => {
                        staleCheck.failure = null;
                        store.review = cancelStoredReview(current);
                        vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                    }),
                    echoStep()
                ],
                decision: APPROVE_DECISION
            };

            const reason = await failureOf(run());

            expect(reason).toBe("The AI review was aborted.");
            expect(echo.calls).toHaveLength(1);
        });
    });
});
