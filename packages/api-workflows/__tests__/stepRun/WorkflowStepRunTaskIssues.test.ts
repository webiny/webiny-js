import { beforeEach, describe, expect, it } from "vitest";
import type { TaskHandler } from "@webiny/api-core/features/task/TaskDefinition/index.js";
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
    fakeActor,
    registerTestStepRunner,
    TestStepRunner
} from "~tests/__helpers/TestStepRunner.js";
import { createAiIssue, expectOk, requester } from "~tests/__helpers/fixtures.js";
import { Review } from "~/domain/review/Review.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { WorkflowStepRunTaskHandler } from "~/features/stepRun/WorkflowStepRunTask/index.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";

const LATER = "2026-10-09T11:00:00.000Z";

const DEFINITION = {
    id: "workflowsStepRun",
    title: "Workflow step run",
    isPrivate: true,
    maxIterations: 10000
};

const setup = async () => {
    const runner = new TestStepRunner();
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
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

    return {
        runner,
        read: async (): Promise<ReviewData> => expectOk(await repository.get("review-1")),
        seed: async (data: ReviewData): Promise<void> => {
            expectOk(await repository.save(data));
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
            expectOk(await repository.save(data));
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

describe("the neutral step run applies the issues of a decision (R171)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
        loggedInfos.length = 0;
        recordedEvents.length = 0;
        reviewSaveFaults.failNext = false;
    });

    it("approves with the comment and stores the issues on the step, as the runner's actor", async () => {
        const { run, seed, read, runner } = await setup();
        const issues = [createAiIssue(), createAiIssue({ fieldPath: null, severity: "info" })];
        runner.runImpl = async () => ({ type: "approved", comment: "Fine with notes.", issues });
        await seed(createFakeStepReview());

        const { result } = run();

        await expect(result).resolves.toMatchObject({ status: "done" });
        const stored = await read();
        expect(stored).toMatchObject({ state: "approved" });
        expect(stored.steps[0]).toMatchObject({
            state: "approved",
            comment: "Fine with notes.",
            owner: fakeActor
        });
        expect(stored.steps[0].issues).toEqual(issues);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepApproved",
            "Workflows/Review/Approved"
        ]);
    });

    it("rejects with the trimmed comment and stores the issues on the step", async () => {
        const { run, seed, read, runner } = await setup();
        const issues = [createAiIssue({ severity: "error", message: "The title is misleading." })];
        runner.runImpl = async () => ({
            type: "rejected",
            comment: "  The title is misleading.  ",
            issues
        });
        await seed(createFakeStepReview());

        const { result } = run();

        await expect(result).resolves.toMatchObject({ status: "done" });
        const stored = await read();
        expect(stored).toMatchObject({ state: "rejected" });
        expect(stored.steps[0]).toMatchObject({
            state: "rejected",
            comment: "The title is misleading.",
            owner: fakeActor
        });
        expect(stored.steps[0].issues).toEqual(issues);
    });

    it.each([
        { name: "approved", outcome: { type: "approved", comment: "Looks good." } },
        { name: "rejected", outcome: { type: "rejected", comment: "The title is misleading." } }
    ])("stores no issues when the $name outcome has none", async ({ outcome }) => {
        const { run, seed, read, runner } = await setup();
        runner.runImpl = async () => outcome as never;
        await seed(createFakeStepReview());

        const { result } = run();

        await expect(result).resolves.toMatchObject({ status: "done" });
        expect((await read()).steps[0].issues).toEqual([]);
    });

    describe("stores no issues when the decision is not applied (Review Focus 1)", () => {
        const issues = [createAiIssue()];
        const outcomes = [
            { name: "approved", outcome: { type: "approved", comment: "Fine.", issues } },
            {
                name: "rejected",
                outcome: { type: "rejected", comment: "The title is misleading.", issues }
            }
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
                it(`ignores a late ${outcomeName} outcome with issues when ${name}`, async () => {
                    const ctx = await setup();
                    ctx.runner.runImpl = async () => {
                        await change(ctx);
                        return outcome as never;
                    };
                    await ctx.seed(createFakeStepReview());

                    const { result } = ctx.run();

                    await expect(result).resolves.toMatchObject({ status: "done" });
                    const stored = await ctx.read();
                    expect(stored.state).toBe(state);
                    expect(stored.steps[0]).toMatchObject({
                        state: "inReview",
                        comment: null,
                        issues: []
                    });
                    expect(workflowEventTypes()).not.toContain("Workflows/Review/StepApproved");
                    expect(workflowEventTypes()).not.toContain("Workflows/Review/StepRejected");
                    expect(loggedInfos).toContain("Ignored a stale step run outcome.");
                    expect(loggedErrors).toEqual([]);
                });
            }
        }

        it("stores no issues and fails the step when a rejection has no usable comment", async () => {
            const { run, seed, read, runner } = await setup();
            runner.runImpl = async () => ({ type: "rejected", comment: "No.", issues });
            await seed(createFakeStepReview());

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored.steps[0]).toMatchObject({ state: "failed", issues: [] });
            expect(stored.steps[0].comment).toBe("The fake step failed.");
            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        });

        it("stores no issues and fails the step when the decision cannot be saved", async () => {
            const { run, seed, read, runner } = await setup();
            runner.runImpl = async () => ({ type: "approved", comment: "Fine.", issues });
            await seed(createFakeStepReview());
            reviewSaveFaults.failNext = true;

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored.steps[0]).toMatchObject({ state: "failed", issues: [] });
            expect(stored.steps[0].comment).toBe("The fake step failed.");
        });
    });

    it("runs the runner for the seeded step and stores the issues on that step", async () => {
        const { run, seed, read, runner } = await setup();
        runner.runImpl = async () => ({ type: "approved", issues: [createAiIssue()] });
        await seed(createFakeStepReview());

        await run().result;

        expect(runner.runCalls).toHaveLength(1);
        expect(runner.runCalls[0].step.id).toBe(AUTOMATION_STEP_ID);
        expect((await read()).steps[0].id).toBe(AUTOMATION_STEP_ID);
        expect((await read()).steps[0].issues).toEqual([createAiIssue()]);
    });
});
