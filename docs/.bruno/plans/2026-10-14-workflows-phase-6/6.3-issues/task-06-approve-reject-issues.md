### Task 6: approve and reject accept `issues`

Spec 4.2, 10; D39, D132; R171; Review Focus 1 (the issues save goes through the guarded approve and reject). The AI runner does not write issues anywhere on its own: it returns them in the decision outcome (Task 19), and the neutral handler applies the outcome through the base `ApproveReviewStepUseCase` / `RejectReviewStepUseCase` after its post-run re-guard (Task 3). So a late AI answer after a cancel or a restart writes no issues, because it writes no decision (D7, D27, SEC-68).

- `features/review/shared/types.ts`: `ReviewDecisionInput` (the shared input of both use cases) gains `issues?: AiIssue[]`. Omitted means `[]`.
- `domain/review/Review.ts`: `ReviewDecisionParams` gains `issues?: AiIssue[]`. `Review.approve` and `Review.reject` store a copy (`issues.map(issue => ({ ...issue }))`, default `[]`) on the step as part of the transition, after the existing guards and, for reject, after the comment rule: a refused approve or reject stores nothing. `Review.checkApprove` and `Review.checkReject` are unchanged (they take no decision data).
- `features/review/ApproveReviewStep/ApproveReviewStepUseCase.ts` and `features/review/RejectReviewStep/RejectReviewStepUseCase.ts`: pass `issues: input.issues` to the aggregate. Facts and events are unchanged: they carry no issues (the event payload's `review` snapshot carries them, like any step field).
- `features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskHandler.ts`: the `approved` and `rejected` branches pass `issues: outcome.issues`. Nothing else in the handler changes; the guards, the re-guard and the one failure path are the ones of Task 3.
- App wrappers (`ApproveCmsEntryReviewStepUseCase`, `RejectCmsEntryReviewStepUseCase`, `ApproveWebsiteBuilderPageReviewStepUseCase`, `RejectWebsiteBuilderPageReviewStepUseCase`) do call the engine's approve and reject, but they build the engine input from their own explicit fields (`reviewId`, `stepId`, `actor`, `actorTeamIds`, `comment`; never a spread of the caller's input), and their GraphQL mutations have no `issues` argument, so a user cannot set issues (D132: issues are AI only). No wrapper or GraphQL change. Two wrapper tests pin it (one in `api-headless-cms-workflows`, one in `api-website-builder-workflows`): a decorator on the engine approve and reject use cases records the forwarded input, and it has no `issues` key even when the caller's input object carries one.
- Validation of the issues (caps and clamps, R171) is the AI runner's job (`normalizeAiIssues`, Task 17); the engine stores what its caller gives it, like `comment`.

**Files:**
- Modify: `packages/api-workflows/src/features/review/shared/types.ts`
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Modify: `packages/api-workflows/src/features/review/ApproveReviewStep/ApproveReviewStepUseCase.ts`
- Modify: `packages/api-workflows/src/features/review/RejectReviewStep/RejectReviewStepUseCase.ts`
- Modify: `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskHandler.ts`
- Create: `packages/api-workflows/__tests__/domain/Review.decisionIssues.test.ts`
- Create: `packages/api-workflows/__tests__/review/ApproveRejectIssues.test.ts`
- Create: `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskIssues.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts` (one added `describe`, imports; no existing expectation changes)
- Modify: `packages/api-website-builder-workflows/__tests__/wrappers/reviewTransitions.test.ts` (same)

**Interfaces:**
- Consumes:
  - Task 5: `AiIssue` (`~/domain/review/types.js`), `ReviewStep.issues`, `createAiIssue` (`~tests/__helpers/fixtures.js`).
  - Task 3: `StepRunnerDecisionOutcome.issues?: AiIssue[]`, `WorkflowStepRunTaskHandler` (constructor `(repository, saver, logger, definitions, runners, approveStep, rejectStep, identityContext)`), `TestStepRunner`, `registerTestStepRunner`, `createFakeStepReview`, `FAKE_STEP_TYPE`, `fakeActor` (`~tests/__helpers/TestStepRunner.js`).
  - Existing: `Review.approve(params: ReviewDecisionParams)`, `Review.reject(params: ReviewDecisionParams)`, `ReviewDecisionInput`, `ApproveReviewStepUseCase.execute(input)`, `RejectReviewStepUseCase.execute(input)`, `createStartedReview`, `expectOk`, `NOW`, `reviewer`, `otherReviewer`, `REVIEW_TEAM_ID`, `requester` (`~tests/__helpers/fixtures.js`), `createReviewContext`, `createRequestInput` (`~tests/__helpers/reviewContext.js`), `recordedEvents`, `workflowEventTypes`, `RecordingEventPublisher`, `createFakeTaskController`, `captureLoggedErrors`, `loggedErrors`, `loggedInfos`, `FailingReviewSave`, `reviewSaveFaults`, `resetFakeTasks`, `AUTOMATION_STEP_ID`.
- Produces (matches the contract):
  - `ReviewDecisionInput.issues?: AiIssue[]`, so `ApproveReviewStepUseCase.Input` and `RejectReviewStepUseCase.Input` accept it. Consumed by Task 19 (through the handler).
  - `ReviewDecisionParams.issues?: AiIssue[]`; `Review.approve` / `Review.reject` store it on the step.
  - The handler passes `outcome.issues` for both decisions. Consumed by Task 19.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/domain/Review.decisionIssues.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
    createAiIssue,
    createStartedReview,
    expectOk,
    otherReviewer,
    REVIEW_TEAM_ID,
    reviewer
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

interface DecisionExtra {
    comment?: string | null;
    issues?: ReturnType<typeof createAiIssue>[];
}

const decision = (extra: DecisionExtra) => {
    return {
        stepId: "legal",
        actor: reviewer,
        actorTeamIds: [REVIEW_TEAM_ID],
        comment: extra.comment ?? null,
        now: LATER,
        ...(extra.issues ? { issues: extra.issues } : {})
    };
};

describe("Review.approve stores the issues (R171)", () => {
    it("stores the given issues on the step, in order", () => {
        const review = createStartedReview();
        const issues = [
            createAiIssue(),
            createAiIssue({ fieldPath: null, severity: "info", suggestion: null })
        ];

        expectOk(review.approve(decision({ comment: "Fine with notes.", issues })));

        const steps = review.toData().steps;
        expect(steps[0]).toMatchObject({ state: "approved", comment: "Fine with notes." });
        expect(steps[0].issues).toEqual(issues);
        expect(steps[1].issues).toEqual([]);
    });

    it("stores no issues when none are given", () => {
        const review = createStartedReview();

        expectOk(review.approve(decision({})));

        expect(review.toData().steps[0].issues).toEqual([]);
    });

    it("stores a copy, so changing the input afterwards changes nothing", () => {
        const review = createStartedReview();
        const issues = [createAiIssue()];

        expectOk(review.approve(decision({ issues })));
        issues[0].message = "Changed after approve.";
        issues.push(createAiIssue({ severity: "error" }));

        expect(review.toData().steps[0].issues).toEqual([createAiIssue()]);
    });

    it("leaves the facts without issues", () => {
        const review = createStartedReview();

        expectOk(review.approve(decision({ comment: "Fine.", issues: [createAiIssue()] })));

        expect(review.pullFacts()).toEqual([
            {
                type: "stepApproved",
                occurredOn: LATER,
                actor: reviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "approved" },
                comment: "Fine."
            }
        ]);
    });

    it("stores nothing when the approve is refused", () => {
        const review = createStartedReview();

        const result = review.approve({
            ...decision({ issues: [createAiIssue()] }),
            actor: otherReviewer
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotOwner");
        expect(review.toData().steps[0]).toMatchObject({ state: "inReview", issues: [] });
    });
});

describe("Review.reject stores the issues (R171)", () => {
    it("stores the given issues next to the trimmed comment", () => {
        const review = createStartedReview();
        const issues = [createAiIssue({ severity: "error", message: "The body is empty." })];

        expectOk(review.reject(decision({ comment: "  The body is empty.  ", issues })));

        const data = review.toData();
        expect(data.state).toBe("rejected");
        expect(data.steps[0]).toMatchObject({ state: "rejected", comment: "The body is empty." });
        expect(data.steps[0].issues).toEqual(issues);
    });

    it("stores no issues when none are given", () => {
        const review = createStartedReview();

        expectOk(review.reject(decision({ comment: "Not ready to publish." })));

        expect(review.toData().steps[0].issues).toEqual([]);
    });

    it("stores a copy, so changing the input afterwards changes nothing", () => {
        const review = createStartedReview();
        const issues = [createAiIssue()];

        expectOk(review.reject(decision({ comment: "Not ready to publish.", issues })));
        issues[0].severity = "info";

        expect(review.toData().steps[0].issues).toEqual([createAiIssue()]);
    });

    it("leaves the facts without issues", () => {
        const review = createStartedReview();

        expectOk(
            review.reject(decision({ comment: "Not ready to publish.", issues: [createAiIssue()] }))
        );

        expect(review.pullFacts()).toEqual([
            {
                type: "stepRejected",
                occurredOn: LATER,
                actor: reviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "rejected" },
                comment: "Not ready to publish."
            }
        ]);
    });

    it("stores nothing when the comment is too short", () => {
        const review = createStartedReview();

        const result = review.reject(decision({ comment: "No.", issues: [createAiIssue()] }));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(review.toData().steps[0]).toMatchObject({ state: "inReview", issues: [] });
    });

    it("stores nothing when the reject is refused", () => {
        const review = createStartedReview();

        const result = review.reject({
            ...decision({ comment: "Not ready to publish.", issues: [createAiIssue()] }),
            actor: otherReviewer
        });

        expect(result.isFail()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({ state: "inReview", issues: [] });
    });
});
```

Create `packages/api-workflows/__tests__/review/ApproveRejectIssues.test.ts`. It drives the two use cases with a user owner: the use cases check no actor type beyond the owner rule, so this proves the engine stores issues for any decision, while the AI handler path is pinned in the third file:

```ts
import { describe, expect, it } from "vitest";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import { recordedEvents } from "~tests/__helpers/RecordingEventPublisher.js";
import {
    createAiIssue,
    expectOk,
    otherReviewer,
    REVIEW_TEAM_ID,
    reviewer
} from "~tests/__helpers/fixtures.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import type { ReviewStepApprovedEvent, ReviewStepRejectedEvent } from "~/features/review/events.js";

const setup = async () => {
    const { context } = await createReviewContext();
    const requested = expectOk(
        await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
    );
    const actorInput = {
        reviewId: requested.id,
        stepId: "legal",
        actor: reviewer,
        actorTeamIds: [REVIEW_TEAM_ID]
    };
    expectOk(await context.container.resolve(StartReviewStepUseCase).execute(actorInput));
    recordedEvents.length = 0;
    return {
        actorInput,
        approve: context.container.resolve(ApproveReviewStepUseCase),
        reject: context.container.resolve(RejectReviewStepUseCase),
        read: async () => {
            return expectOk(
                await context.container.resolve(GetReviewUseCase).execute({ id: requested.id })
            );
        }
    };
};

describe("ApproveReviewStepUseCase issues (R171)", () => {
    it("stores the issues on the approved step and returns them", async () => {
        const { actorInput, approve, read } = await setup();
        const issues = [createAiIssue(), createAiIssue({ fieldPath: null, suggestion: null })];

        const result = expectOk(
            await approve.execute({ ...actorInput, comment: "Fine with notes.", issues })
        );

        expect(result.steps[0]).toMatchObject({ state: "approved", comment: "Fine with notes." });
        expect(result.steps[0].issues).toEqual(issues);
        expect((await read()).steps[0].issues).toEqual(issues);
        expect((await read()).steps[1].issues).toEqual([]);
    });

    it("stores no issues when the input has none (default [])", async () => {
        const { actorInput, approve, read } = await setup();

        expectOk(await approve.execute(actorInput));

        expect((await read()).steps[0].issues).toEqual([]);
    });

    it("keeps the event fact free of issues and puts them in the review snapshot", async () => {
        const { actorInput, approve } = await setup();
        const issues = [createAiIssue()];

        expectOk(await approve.execute({ ...actorInput, comment: "Fine.", issues }));

        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepApproved"
        ) as ReviewStepApprovedEvent;
        expect(event.payload.fact).toEqual({
            type: "stepApproved",
            occurredOn: expect.any(String),
            actor: reviewer,
            change: { stepId: "legal", fromState: "inReview", toState: "approved" },
            comment: "Fine."
        });
        expect(event.payload.review.steps[0].issues).toEqual(issues);
    });

    it("stores nothing for an actor that does not own the step", async () => {
        const { actorInput, approve, read } = await setup();

        const result = await approve.execute({
            ...actorInput,
            actor: otherReviewer,
            issues: [createAiIssue()]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotOwner");
        expect((await read()).steps[0]).toMatchObject({ state: "inReview", issues: [] });
        expect(recordedEvents).toEqual([]);
    });
});

describe("RejectReviewStepUseCase issues (R171)", () => {
    it("stores the issues on the rejected step and returns them", async () => {
        const { actorInput, reject, read } = await setup();
        const issues = [createAiIssue({ severity: "error", message: "The body is empty." })];

        const result = expectOk(
            await reject.execute({ ...actorInput, comment: "The body is empty.", issues })
        );

        expect(result).toMatchObject({ state: "rejected" });
        expect(result.steps[0].issues).toEqual(issues);
        expect((await read()).steps[0].issues).toEqual(issues);
    });

    it("stores no issues when the input has none (default [])", async () => {
        const { actorInput, reject, read } = await setup();

        expectOk(await reject.execute({ ...actorInput, comment: "Not ready to publish." }));

        expect((await read()).steps[0].issues).toEqual([]);
    });

    it("keeps the event fact free of issues and puts them in the review snapshot", async () => {
        const { actorInput, reject } = await setup();
        const issues = [createAiIssue({ severity: "error" })];

        expectOk(await reject.execute({ ...actorInput, comment: "Not ready to publish.", issues }));

        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepRejected"
        ) as ReviewStepRejectedEvent;
        expect(event.payload.fact).toEqual({
            type: "stepRejected",
            occurredOn: expect.any(String),
            actor: reviewer,
            change: { stepId: "legal", fromState: "inReview", toState: "rejected" },
            comment: "Not ready to publish."
        });
        expect(event.payload.review.steps[0].issues).toEqual(issues);
    });

    it("stores nothing when the comment is too short", async () => {
        const { actorInput, reject, read } = await setup();

        const result = await reject.execute({
            ...actorInput,
            comment: "No.",
            issues: [createAiIssue()]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(await read()).toMatchObject({ state: "inProgress" });
        expect((await read()).steps[0].issues).toEqual([]);
        expect(recordedEvents).toEqual([]);
    });
});
```

Create `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskIssues.test.ts`. It drives the neutral handler with the fake runner of Task 3 (the owner is an `ai` actor), pins that the issues reach the stored step through the base use cases and that a late or failed outcome stores no issues (Review Focus 1):

```ts
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
```

Modify `packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts`. Add the imports next to the other imports (the two wrapper use cases are already imported there):

```ts
import type { Container } from "@webiny/di";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
```

and add this `describe` directly before the `/** A stored API key (created by the admin) ... */` comment (the helpers `createScenario`, `start`, `createUserContext`, `REVIEWER`, `CMS_READER`, `STEP_ID` and `expectOk` already exist in the file). It decorates the engine's approve and reject use cases to record the forwarded input, like `CountingEngineCalls` does for the call names (that helper records names only, so the recorder lives in this test file):

```ts
type ForwardedDecision = ApproveReviewStepUseCase.Input | RejectReviewStepUseCase.Input;

/** The inputs the wrappers forwarded to the engine's approve and reject. Cleared in `beforeEach`. */
const forwardedDecisions: ForwardedDecision[] = [];

class RecordingApproveReviewStep implements ApproveReviewStepUseCase.Interface {
    public constructor(private decoratee: ApproveReviewStepUseCase.Interface) {}

    public async execute(input: ApproveReviewStepUseCase.Input): ApproveReviewStepUseCase.Return {
        forwardedDecisions.push(input);
        return this.decoratee.execute(input);
    }
}

class RecordingRejectReviewStep implements RejectReviewStepUseCase.Interface {
    public constructor(private decoratee: RejectReviewStepUseCase.Interface) {}

    public async execute(input: RejectReviewStepUseCase.Input): RejectReviewStepUseCase.Return {
        forwardedDecisions.push(input);
        return this.decoratee.execute(input);
    }
}

const recordForwardedDecisions = (container: Container) => {
    container.registerDecorator(
        ApproveReviewStepUseCase.createDecorator({
            decorator: RecordingApproveReviewStep,
            dependencies: []
        })
    );
    container.registerDecorator(
        RejectReviewStepUseCase.createDecorator({
            decorator: RecordingRejectReviewStep,
            dependencies: []
        })
    );
};

/** What a hostile or careless caller could put on a decision input next to the allowed fields. */
const SMUGGLED_ISSUES = [
    {
        fieldPath: "title",
        severity: "error",
        message: "Smuggled in by the caller.",
        suggestion: null
    }
];

describe("CMS review decision wrappers forward no issues (D132, R171)", () => {
    beforeEach(() => {
        forwardedDecisions.length = 0;
    });

    it("forwards an approve input without issues, even when the caller's input carries some", async () => {
        const { review } = await createScenario();
        const reviewer = await createUserContext({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [recordForwardedDecisions]
        });
        expectOk(await start(reviewer, review.id));
        const input = {
            reviewId: review.id,
            stepId: STEP_ID,
            comment: "Looks good.",
            issues: SMUGGLED_ISSUES
        };

        const approved = expectOk(
            await reviewer.container.resolve(ApproveCmsEntryReviewStepUseCase).execute(input)
        );

        expect(forwardedDecisions).toHaveLength(1);
        expect("issues" in forwardedDecisions[0]).toBe(false);
        expect(Object.keys(forwardedDecisions[0]).sort()).toEqual([
            "actor",
            "actorTeamIds",
            "comment",
            "reviewId",
            "stepId"
        ]);
        expect(approved.steps[0].issues ?? []).toEqual([]);
    });

    it("forwards a reject input without issues, even when the caller's input carries some", async () => {
        const { review } = await createScenario();
        const reviewer = await createUserContext({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [recordForwardedDecisions]
        });
        expectOk(await start(reviewer, review.id));
        const input = {
            reviewId: review.id,
            stepId: STEP_ID,
            comment: "Needs another pass.",
            issues: SMUGGLED_ISSUES
        };

        const rejected = expectOk(
            await reviewer.container.resolve(RejectCmsEntryReviewStepUseCase).execute(input)
        );

        expect(forwardedDecisions).toHaveLength(1);
        expect("issues" in forwardedDecisions[0]).toBe(false);
        expect(Object.keys(forwardedDecisions[0]).sort()).toEqual([
            "actor",
            "actorTeamIds",
            "comment",
            "reviewId",
            "stepId"
        ]);
        expect(rejected.steps[0].issues ?? []).toEqual([]);
    });
});
```

Modify `packages/api-website-builder-workflows/__tests__/wrappers/reviewTransitions.test.ts`. Add the imports next to the other imports:

```ts
import type { Container } from "@webiny/di";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
```

and add this `describe` directly before the `describe("API keys in page reviews (D133 point 5, R79)"` block (the helpers `createScenario`, `start`, `createUserContext`, `REVIEWER`, `WB_READER`, `STEP_ID` and `expectOk` already exist in the file). It decorates the engine's approve and reject use cases to record the forwarded input, like `CountingEngineCalls` does for the call names (that helper records names only, so the recorder lives in this test file):

```ts
type ForwardedDecision = ApproveReviewStepUseCase.Input | RejectReviewStepUseCase.Input;

/** The inputs the wrappers forwarded to the engine's approve and reject. Cleared in `beforeEach`. */
const forwardedDecisions: ForwardedDecision[] = [];

class RecordingApproveReviewStep implements ApproveReviewStepUseCase.Interface {
    public constructor(private decoratee: ApproveReviewStepUseCase.Interface) {}

    public async execute(input: ApproveReviewStepUseCase.Input): ApproveReviewStepUseCase.Return {
        forwardedDecisions.push(input);
        return this.decoratee.execute(input);
    }
}

class RecordingRejectReviewStep implements RejectReviewStepUseCase.Interface {
    public constructor(private decoratee: RejectReviewStepUseCase.Interface) {}

    public async execute(input: RejectReviewStepUseCase.Input): RejectReviewStepUseCase.Return {
        forwardedDecisions.push(input);
        return this.decoratee.execute(input);
    }
}

const recordForwardedDecisions = (container: Container) => {
    container.registerDecorator(
        ApproveReviewStepUseCase.createDecorator({
            decorator: RecordingApproveReviewStep,
            dependencies: []
        })
    );
    container.registerDecorator(
        RejectReviewStepUseCase.createDecorator({
            decorator: RecordingRejectReviewStep,
            dependencies: []
        })
    );
};

/** What a hostile or careless caller could put on a decision input next to the allowed fields. */
const SMUGGLED_ISSUES = [
    {
        fieldPath: "title",
        severity: "error",
        message: "Smuggled in by the caller.",
        suggestion: null
    }
];

describe("Website Builder review decision wrappers forward no issues (D132, R171)", () => {
    beforeEach(() => {
        forwardedDecisions.length = 0;
    });

    it("forwards an approve input without issues, even when the caller's input carries some", async () => {
        const { review } = await createScenario();
        const reviewer = await createUserContext({
            identity: REVIEWER,
            permissions: WB_READER,
            legacyPlugins: [recordForwardedDecisions]
        });
        expectOk(await start(reviewer, review.id));
        const input = {
            reviewId: review.id,
            stepId: STEP_ID,
            comment: "Looks good.",
            issues: SMUGGLED_ISSUES
        };

        const approved = expectOk(
            await reviewer.container.resolve(ApproveWebsiteBuilderPageReviewStepUseCase).execute(input)
        );

        expect(forwardedDecisions).toHaveLength(1);
        expect("issues" in forwardedDecisions[0]).toBe(false);
        expect(Object.keys(forwardedDecisions[0]).sort()).toEqual([
            "actor",
            "actorTeamIds",
            "comment",
            "reviewId",
            "stepId"
        ]);
        expect(approved.steps[0].issues ?? []).toEqual([]);
    });

    it("forwards a reject input without issues, even when the caller's input carries some", async () => {
        const { review } = await createScenario();
        const reviewer = await createUserContext({
            identity: REVIEWER,
            permissions: WB_READER,
            legacyPlugins: [recordForwardedDecisions]
        });
        expectOk(await start(reviewer, review.id));
        const input = {
            reviewId: review.id,
            stepId: STEP_ID,
            comment: "Needs another pass.",
            issues: SMUGGLED_ISSUES
        };

        const rejected = expectOk(
            await reviewer.container.resolve(RejectWebsiteBuilderPageReviewStepUseCase).execute(input)
        );

        expect(forwardedDecisions).toHaveLength(1);
        expect("issues" in forwardedDecisions[0]).toBe(false);
        expect(Object.keys(forwardedDecisions[0]).sort()).toEqual([
            "actor",
            "actorTeamIds",
            "comment",
            "reviewId",
            "stepId"
        ]);
        expect(rejected.steps[0].issues ?? []).toEqual([]);
    });
});
```

In the Website Builder file add the same `Container`, `ApproveReviewStepUseCase` and `RejectReviewStepUseCase` imports. The two wrapper use cases (`ApproveWebsiteBuilderPageReviewStepUseCase`, `RejectWebsiteBuilderPageReviewStepUseCase`) are already imported there.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
yarn test packages/api-workflows/__tests__/domain/Review.decisionIssues.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ApproveRejectIssues.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskIssues.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/domain/Review.decisionIssues.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/ApproveRejectIssues.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskIssues.test.ts 2>&1 | tail -50
```

The two wrapper tests are regression pins and pass already (the wrappers never forwarded `issues`); run them in Step 5.

Expected: FAIL on both storages. The stored `issues` stay `[]` where the given ones are expected (the aggregate ignores the parameter, the use cases and the handler do not pass it). The "stores nothing" and "no issues when none" cases already pass; that is expected.

- [ ] **Step 3: Write the implementation**

In `packages/api-workflows/src/features/review/shared/types.ts`, import `AiIssue` and extend the decision input:

```ts
import type { Actor, AiIssue } from "~/domain/review/types.js";
```

```ts
export interface ReviewDecisionInput extends ReviewActorInput {
    comment?: string | null;
    /**
     * The findings of an AI decision (D39, R171), stored on the step; omitted means none. Only
     * the engine's own callers set it: the app wrappers build their input from explicit fields
     * and do not expose it (D132).
     */
    issues?: AiIssue[];
}
```

In `packages/api-workflows/src/domain/review/Review.ts`, add `AiIssue` to the type import from `./types.js`:

```ts
import type {
    Actor,
    AiIssue,
    ReviewData,
    ReviewPick,
    ReviewState,
    ReviewStep,
    ReviewSystemWorkflow,
    StepAssignmentResolution,
    StepState,
    TargetContext
} from "./types.js";
```

Extend `ReviewDecisionParams`:

```ts
/** `actorTeamIds` is not read by approve or reject: only the owner decides (spec 5.1). */
export interface ReviewDecisionParams extends ReviewActorParams {
    comment: string | null;
    /** The findings of an AI decision, stored on the step (R171); omitted means none. */
    issues?: AiIssue[];
}
```

In `Review.approve`, store the issues next to the comment:

```ts
        step.state = "approved";
        step.comment = params.comment;
        step.issues = (params.issues ?? []).map(issue => ({ ...issue }));
        step.finishedOn = params.now;
```

In `Review.reject`, after the comment rule (so a refused reject stores nothing):

```ts
        step.state = "rejected";
        step.comment = comment;
        step.issues = (params.issues ?? []).map(issue => ({ ...issue }));
        step.finishedOn = params.now;
        this.data.state = "rejected";
```

In `packages/api-workflows/src/features/review/ApproveReviewStep/ApproveReviewStepUseCase.ts`:

```ts
        const approved = review.approve({
            stepId: input.stepId,
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            comment: input.comment ?? null,
            issues: input.issues,
            now
        });
```

In `packages/api-workflows/src/features/review/RejectReviewStep/RejectReviewStepUseCase.ts`:

```ts
        const rejected = review.reject({
            stepId: input.stepId,
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            comment: input.comment ?? null,
            issues: input.issues,
            now: new Date().toISOString()
        });
```

In `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskHandler.ts`, in the `// Apply the outcome` switch (numbered by Task 4), pass the outcome's issues in the two branches; nothing else changes:

```ts
                    case "approved": {
                        const approved = await this.approveStep.execute({
                            reviewId,
                            stepId,
                            actor: runner.getActor(requester),
                            actorTeamIds: [],
                            comment: outcome.comment,
                            issues: outcome.issues
                        });
```

```ts
                        const rejected = await this.rejectStep.execute({
                            reviewId,
                            stepId,
                            actor: runner.getActor(requester),
                            actorTeamIds: [],
                            comment,
                            issues: outcome.issues
                        });
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
yarn test packages/api-workflows/__tests__/domain/Review.decisionIssues.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ApproveRejectIssues.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskIssues.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/domain/Review.decisionIssues.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/ApproveRejectIssues.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskIssues.test.ts 2>&1 | tail -50
```

Expected: PASS on both storages.

- [ ] **Step 5: Run the existing tests that cover the changed code**

These must stay green unchanged (the field is optional; a decision without `issues` behaves as before). Run each on both storages (`yarn test` and `yarn test:os`, one `test:os` at a time):

```bash
yarn test packages/api-workflows/__tests__/domain/Review.decisions.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/domain/Review.checks.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/domain/Review.minimumLengths.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/RequestTitleAndRejectComment.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskDispatch.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskSignals.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRunnerHooks.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/domain/Review.decisions.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/domain/Review.checks.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/domain/Review.minimumLengths.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/RequestTitleAndRejectComment.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskDispatch.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskSignals.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRunnerHooks.test.ts 2>&1 | tail -50
yarn test packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/wrappers/reviewTransitions.test.ts 2>&1 | tail -50
yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40
yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40
yarn check:test:types -p api-website-builder-workflows --report cli 2>&1 | tail -40
```

Expected: PASS; the type checks print no errors.

- [ ] **Step 6: Pre-commit chain and commit**

Run the pre-commit chain from the Global Constraints for `@webiny/api-workflows` (`yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`), then:

```bash
git add .
git commit -m "feat(api-workflows): accept issues on approve and reject" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```
