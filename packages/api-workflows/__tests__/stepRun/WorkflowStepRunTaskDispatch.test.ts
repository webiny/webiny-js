import { beforeEach, describe, expect, it } from "vitest";
import type { TaskHandler } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { FailingReviewSave, reviewSaveFaults } from "~tests/__helpers/FailingReviewSave.js";
import {
    captureLoggedErrors,
    loggedErrors,
    loggedInfos
} from "~tests/__helpers/CapturingLogger.js";
import {
    createFakeTaskController,
    type FakeTaskControllerParams
} from "~tests/__helpers/FakeTaskController.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import { AUTOMATION_STEP_ID } from "~tests/__helpers/stepRunReviews.js";
import {
    createFakeStepReview,
    FAKE_STEP_TYPE,
    fakeActor,
    registerTestStepRunner,
    TestStepRunner,
    type TestStepRunnerOptions
} from "~tests/__helpers/TestStepRunner.js";
import { expectOk, requester } from "~tests/__helpers/fixtures.js";
import {
    FailingReviewGet,
    resetReviewGetFaults,
    reviewGetFaults
} from "~tests/__helpers/FailingReviewGet.js";
import { Review } from "~/domain/review/Review.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { StepRunFailure } from "~/features/stepRun/StepRunFailure.js";
import { WorkflowStepRunTaskHandler } from "~/features/stepRun/WorkflowStepRunTask/index.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";

const LATER = "2026-10-09T11:00:00.000Z";

const DEFINITION = {
    id: "workflowsStepRun",
    title: "Workflow step run",
    isPrivate: true,
    maxIterations: 10000
};

const INPUT: StepRunTaskInput = { reviewId: "review-1", stepId: AUTOMATION_STEP_ID };

const setup = async (options: TestStepRunnerOptions = {}) => {
    const runner = new TestStepRunner(options);
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FailingReviewGet);
            container.registerDecorator(FailingReviewSave);
            container.registerDecorator(RecordingEventPublisher);
            registerTestStepRunner(container, runner);
        }
    });
    const handler = context.container.resolveImplementation(
        WorkflowStepRunTaskHandler
    ) as TaskHandler.Interface<StepRunTaskInput>;
    const repository = context.container.resolve(ReviewRepository);
    const saver = context.container.resolve(ReviewSaver);
    const identityContext = context.container.resolve(IdentityContext);

    return {
        runner,
        identityContext,
        read: async (): Promise<ReviewData> => expectOk(await repository.get("review-1")),
        seed: async (data: ReviewData): Promise<void> => {
            expectOk(await repository.create(data));
            recordedEvents.length = 0;
        },
        /** Cancels the stored review, as a requester would while the runner works. */
        cancel: async (): Promise<void> => {
            const review = Review.fromData(expectOk(await repository.get("review-1")));
            expectOk(review.cancel({ actor: requester, now: LATER }));
            expectOk(await saver.save(review));
        },
        /** Restarts the step under another task, as the restart use case would. */
        moveToAnotherTask: async (): Promise<void> => {
            const data = expectOk(await repository.get("review-1"));
            data.steps[0].taskId = "task-new";
            expectOk(await repository.update(data));
        },
        run: (controllerParams: FakeTaskControllerParams = {}) => {
            const { controller, task, outputUpdates } = createFakeTaskController(controllerParams);
            return {
                task,
                outputUpdates,
                result: handler.run({ input: task.input, controller, definition: DEFINITION })
            };
        }
    };
};

describe("workflowsStepRun dispatches by the step type (R168)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
        loggedInfos.length = 0;
        recordedEvents.length = 0;
        reviewSaveFaults.failNext = false;
        resetReviewGetFaults();
    });

    describe("runs the runner registered for the step's type", () => {
        it("hands it the review, the step, the requester, the task, the iteration, the state and the signal", async () => {
            const { run, seed, runner } = await setup();
            await seed(createFakeStepReview());

            // Three waits for the task id, then the first run (task iteration 4).
            const { result } = run({ iterations: 4 });

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect(runner.runCalls).toHaveLength(1);
            const [call] = runner.runCalls;
            expect(call.review.id).toBe("review-1");
            expect(call.step).toMatchObject({ id: AUTOMATION_STEP_ID, type: FAKE_STEP_TYPE });
            expect(call.requester).toMatchObject(requester);
            expect(call.task).toEqual({ id: "task-1", createdById: requester.id });
            expect(call.iteration).toBe(1);
            expect(call.state).toBeNull();
            expect(call.signal.aborted).toBe(false);
        });

        it("reads the state and the wait count of the task output", async () => {
            const { run, seed, runner } = await setup();
            runner.runImpl = async () => ({ type: "continue" });
            await seed(createFakeStepReview());

            const { result } = run({
                iterations: 6,
                output: { idWaits: 3, state: { page: 2 } }
            });
            await result;

            expect(runner.runCalls[0].iteration).toBe(3);
            expect(runner.runCalls[0].state).toEqual({ page: 2 });
        });

        it("approves as the runner's actor with the runner's comment", async () => {
            const { run, seed, read } = await setup();
            await seed(createFakeStepReview());

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored).toMatchObject({ state: "approved", currentStepState: "approved" });
            expect(stored.steps[0]).toMatchObject({
                state: "approved",
                comment: "Looks good.",
                owner: fakeActor
            });
            expect(workflowEventTypes()).toEqual([
                "Workflows/Review/StepApproved",
                "Workflows/Review/Approved"
            ]);
            const approved = recordedEvents.find(
                event => event.eventType === "Workflows/Review/StepApproved"
            );
            expect(approved?.payload.fact.actor).toEqual(fakeActor);
        });

        it("rejects as the runner's actor with the trimmed comment", async () => {
            const { run, seed, read, runner } = await setup();
            runner.runImpl = async () => ({
                type: "rejected",
                comment: "  The title is misleading.  "
            });
            await seed(createFakeStepReview());

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored).toMatchObject({ state: "rejected", currentStepState: "rejected" });
            expect(stored.steps[0]).toMatchObject({
                state: "rejected",
                comment: "The title is misleading.",
                owner: fakeActor
            });
            const rejected = recordedEvents.find(
                event => event.eventType === "Workflows/Review/StepRejected"
            );
            expect(rejected?.payload.fact.actor).toEqual(fakeActor);
        });

        it("continues with the delay and writes the whole output, as for automation (R135, R163)", async () => {
            const { run, seed, read, runner } = await setup();
            runner.runImpl = async () => ({ type: "continue", wait: 3, state: { page: 1 } });
            await seed(createFakeStepReview());

            const first = run({ iterations: 4 });
            const firstResult = await first.result;
            const second = run({ iterations: 5, output: { idWaits: 3, state: { page: 1 } } });
            await second.result;

            expect(firstResult).toEqual({ status: "continue", input: INPUT, wait: 3 });
            expect(first.outputUpdates).toEqual([{ idWaits: 3, state: { page: 1 } }]);
            expect(runner.runCalls.map(call => call.iteration)).toEqual([1, 2]);
            expect(runner.runCalls.map(call => call.state)).toEqual([null, { page: 1 }]);
            expect((await read()).steps[0]).toMatchObject({ state: "inReview", comment: null });
            expect(workflowEventTypes()).toEqual([]);
        });

        it("keeps the previous state when a continue outcome gives none", async () => {
            const { run, seed, runner } = await setup();
            runner.runImpl = async () => ({ type: "continue" });
            await seed(createFakeStepReview());

            const { result, outputUpdates } = run({
                iterations: 5,
                output: { idWaits: 3, state: { page: 1 } }
            });

            await expect(result).resolves.toEqual({
                status: "continue",
                input: INPUT,
                wait: undefined
            });
            expect(outputUpdates).toEqual([{ idWaits: 3, state: { page: 1 } }]);
        });

        it("runs as the requester", async () => {
            const { run, seed, runner, identityContext } = await setup();
            const identities: string[] = [];
            runner.runImpl = async () => {
                identities.push(identityContext.getIdentity().id);
                return { type: "approved" };
            };
            await seed(createFakeStepReview());
            const outer = identityContext.getIdentity().id;

            await run().result;

            expect(outer).not.toBe(requester.id);
            expect(identities).toEqual([requester.id]);
            expect(identityContext.getIdentity().id).toBe(outer);
        });
    });

    describe("fails the step with the runner's reasons through the one failure path (R146)", () => {
        const expectFailed = async (read: () => Promise<ReviewData>, reason: string) => {
            const stored = await read();
            expect(stored).toMatchObject({ state: "inProgress", currentStepState: "failed" });
            expect(stored.steps[0]).toMatchObject({ state: "failed", owner: fakeActor });
            expect(stored.steps[0].comment).toBe(reason);
            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        };

        it("with the reason of a StepRunFailure the runner throws", async () => {
            const { run, seed, read, runner } = await setup();
            runner.runImpl = async () => {
                throw new StepRunFailure("The fake step ran out of room.");
            };
            await seed(createFakeStepReview());

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The fake step ran out of room.");
            expect(loggedErrors).toEqual([]);
        });

        it.each([
            { name: "no comment", outcome: { type: "rejected" } },
            {
                name: "a comment shorter than 10 characters",
                outcome: { type: "rejected", comment: "No." }
            }
        ])(
            "with the runner's error reason when it rejects with $name (D100)",
            async ({ outcome }) => {
                const { run, seed, read, runner } = await setup();
                runner.runImpl = async () => outcome as never;
                await seed(createFakeStepReview());

                const { result } = run();

                await expect(result).resolves.toMatchObject({ status: "done" });
                await expectFailed(read, "The fake step failed.");
            }
        );

        it("with the runner's error reason for an unknown outcome", async () => {
            const { run, seed, read, runner } = await setup();
            runner.runImpl = async () => ({ type: "nonsense" }) as never;
            await seed(createFakeStepReview());

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The fake step failed.");
        });

        it("with the runner's error reason when the outcome cannot be saved", async () => {
            const { run, seed, read } = await setup();
            await seed(createFakeStepReview());
            reviewSaveFaults.failNext = true;

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The fake step failed.");
            expect(loggedErrors.map(logged => logged.message)).toContain(
                "Applying the automation outcome failed."
            );
        });

        it("returns the task error for an error the runner throws that is not a StepRunFailure, and leaves the review", async () => {
            const { run, seed, read, runner } = await setup();
            runner.runImpl = async () => {
                throw new Error("The runner crashed.");
            };
            await seed(createFakeStepReview());
            const before = await read();

            const { result } = run();

            await expect(result).resolves.toEqual({
                status: "error",
                error: { message: "The step run failed.", code: "Workflows/StepRun/Failed" }
            });
            expect(await read()).toEqual(before);
            // The raw error is logged only (R146, D188).
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe("The step run failed with an unexpected error.");
            expect((loggedErrors[0].fields.err as Error).message).toBe("The runner crashed.");
        });

        it("stores only the message and code of a domain error, never its raw source (R146, D188)", async () => {
            const { run, seed } = await setup();
            await seed(createFakeStepReview());
            reviewGetFaults.mode = "fail";

            const { result } = run();
            const resolved = await result;

            expect(resolved).toMatchObject({
                status: "error",
                error: { code: "Workflows/Review/Persistence" }
            });
            const stored = (resolved as { error: Record<string, unknown> }).error;
            expect(Object.keys(stored).sort()).toEqual(["code", "message"]);
            expect(JSON.stringify(stored)).not.toContain("Storage is down.");
        });
    });

    describe("a step type with no runner (R168)", () => {
        it("fails the step with the type not available text, without calling any runner", async () => {
            const { run, seed, read, runner } = await setup();
            await seed(createFakeStepReview("task-1", "no-such-runner"));

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored).toMatchObject({ state: "inProgress", currentStepState: "failed" });
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: 'The step type "no-such-runner" is not available.'
            });
            expect(runner.runCalls).toEqual([]);
            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
            expect(loggedErrors).toEqual([]);
        });

        it("still waits for the task id first, like every step type (R143)", async () => {
            const { run, seed, read } = await setup();
            await seed(createFakeStepReview(null, "no-such-runner"));
            const before = await read();

            const { result } = run({ iterations: 1 });

            await expect(result).resolves.toEqual({ status: "continue", input: INPUT, wait: 2 });
            expect(await read()).toEqual(before);
        });
    });

    describe("keeps the stale guard for every step type (D7, D27, R144, Review Focus 1)", () => {
        it.each([
            {
                name: "the task was created by someone else",
                params: { createdById: "user-intruder" } as FakeTaskControllerParams,
                taskId: "task-1"
            },
            {
                name: "the step carries another task",
                params: { iterations: 4 } as FakeTaskControllerParams,
                taskId: "task-other"
            }
        ])("never reaches the runner when $name", async ({ params, taskId }) => {
            const { run, seed, runner } = await setup();
            await seed(createFakeStepReview(taskId));

            const { result } = run({ iterations: 4, ...params });

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect(runner.runCalls).toEqual([]);
            expect(workflowEventTypes()).toEqual([]);
        });

        const outcomes = [
            { name: "approved", outcome: { type: "approved", comment: "Looks good." } },
            {
                name: "rejected",
                outcome: { type: "rejected", comment: "The title is misleading." }
            },
            { name: "continue", outcome: { type: "continue", wait: 1 } }
        ];
        const changes = [
            {
                name: "the review was cancelled during the run",
                change: async (ctx: Awaited<ReturnType<typeof setup>>) => ctx.cancel(),
                state: "cancelled"
            },
            {
                name: "the step was restarted under a new task during the run",
                change: async (ctx: Awaited<ReturnType<typeof setup>>) => ctx.moveToAnotherTask(),
                state: "inProgress"
            }
        ];

        for (const { name: outcomeName, outcome } of outcomes) {
            for (const { name, change, state } of changes) {
                it(`ignores a late ${outcomeName} outcome when ${name}`, async () => {
                    const ctx = await setup();
                    ctx.runner.runImpl = async () => {
                        await change(ctx);
                        return outcome as never;
                    };
                    await ctx.seed(createFakeStepReview());

                    const { result, outputUpdates } = ctx.run();

                    await expect(result).resolves.toMatchObject({ status: "done" });
                    const stored = await ctx.read();
                    expect(stored.state).toBe(state);
                    expect(stored.steps[0]).toMatchObject({ state: "inReview", comment: null });
                    expect(outputUpdates).toEqual([]);
                    expect(loggedInfos).toContain("Ignored a stale step run outcome.");
                    expect(loggedErrors).toEqual([]);
                });
            }
        }

        it("writes nothing when the review was cancelled while the runner failed", async () => {
            const { run, seed, read, cancel, runner } = await setup();
            runner.runImpl = async () => {
                await cancel();
                throw new StepRunFailure("The fake step failed late.");
            };
            await seed(createFakeStepReview());

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored.state).toBe("cancelled");
            expect(stored.steps[0].state).toBe("inReview");
            expect(workflowEventTypes()).toEqual(["Workflows/Review/Cancelled"]);
            expect(loggedInfos).toContain("Ignored a stale step run failure.");
        });
    });

    describe("never trusts its input (R148)", () => {
        it("picks the runner from the review snapshot, not from the input", async () => {
            const { run, seed, runner } = await setup();
            await seed(createFakeStepReview());

            const { result } = run({
                input: { ...INPUT, type: "automation", automationId: "other" } as never
            });
            await result;

            expect(runner.runCalls).toHaveLength(1);
            expect(runner.runCalls[0].step.type).toBe(FAKE_STEP_TYPE);
        });
    });
});
