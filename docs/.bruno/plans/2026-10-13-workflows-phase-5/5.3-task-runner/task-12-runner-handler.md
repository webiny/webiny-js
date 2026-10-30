### Task 12: Run handler: wait for the task id, run the automation, apply the outcome

Spec 5.1, 7.4, 9.2; D7, D27, D36, D57, D87, D100; R135, R142, R143, R144, R145, R146, R148, R150, R157, R159, R161, R162, R163; A53; Review Focus 1, 2, 3, 4. `WorkflowStepRunTaskHandler.run` (a placeholder returning done since Task 11) becomes the engine of an automation step. One iteration of the private `workflowsStepRun` task does this, in order:

1. **Read and guard (R144, R148).** It reads nothing from the input but `reviewId` and `stepId`. It loads the review and applies the stale guard with the task's own id and `createdBy.id` (`controller.state.getTask()`). A forged task (SEC-68: another creator, another task id) or a review that is cancelled, finished or moved on never matches.
2. **Wait for the task id (R143, R163, Review Focus 2).** The trigger runs before the review is saved, so the first iteration can start before the review exists (a new review is created by the one save) or before the step carries this task's id (a later step reached by approve, or a restarted step, is saved after the trigger). Only those two cases wait: the review is not found, or the review is active and in progress and the step exists but its `taskId` is not this task's id yet (`null`, or another id). While `task.iterations <= STEP_RUN_TASKID_WAIT_TRIES` (3, so at most three waits) the handler returns `controller.response.continue(input, { seconds: STEP_RUN_TASKID_WAIT_SECONDS })` (2); past that it treats the run as stale: log at info, write nothing, `done`. Any other guard result (review inactive or not in progress, step not current or not in review, task created by someone else while the step carries its id) does not wait: the task ends at once (stale, nothing written, `done`). A failed read that is not "not found" is a task error (`controller.response.error`, the `onError` hook then guards and writes nothing if the review is unreadable).
3. **Look up and validate (R145, R146, R148, R163).** The step config (`automationStepConfigSchema`) names the automation; a config that no longer parses fails the step with `The automation step configuration is not valid.` (P3); the definition comes from `AutomationDefinitionRegistryService` (a missing one fails the step). The run count is `iteration = task.iterations - idWaits`, where `idWaits` is read from the task output (`controller.state.getOutput()?.idWaits`) and, on the first guarded run (nothing stored yet), is `task.iterations - 1` (every earlier iteration was a wait). The automation's own limit is `definition.maxIterations ?? DEFAULT_AUTOMATION_MAX_ITERATIONS` (50), compared with `iteration` (runs, never waits): `iteration > limit` fails the step with `The automation did not finish in <limit> iterations.`. The stored settings are parsed with the definition's schema before every `run` (`parseAutomationSettings`, invalid settings fail the step) and `run` receives the parsed value and `iteration` (1 on its first run).
4. **Run as the requester, inside the bypass (R150, R161, Review Focus 3).** Everything from here on, including the failure path, runs inside `IdentityContext.withIdentity(requesterIdentity, ...)` where `requesterIdentity` is built from `review.createdBy` exactly as in R149 (`new AuthenticatedIdentity({ id, displayName, type: identityType ?? "admin", context: { canAccessTenant: true } })`); the handler adds no authorization switch: the task runner already runs `definition.run` under `withoutAuthorization` (D36, D26), so the run is attributed to the requester but not limited by their permissions. `WorkflowBypassService.run(() => definition.run({ settings, review, step, iteration, state }))`: the flag exists only around that call and is restored in `finally`; the approve and reject below run outside it (but inside the requester identity). `state` is `controller.state.getOutput()?.state ?? null`: what the previous iteration returned. A throwing `run` fails the step with the fixed `The automation failed.` and the error is logged.
5. **Apply the outcome (R135, R141, R162).** `approved` calls `ApproveReviewStepUseCase.execute({ reviewId, stepId, actor: getAutomationActor(review.createdBy), actorTeamIds: [], comment })`; `rejected` needs a comment of `REJECT_COMMENT_MIN_LENGTH` (10) characters after trimming (else the step fails with `The automation rejected without a comment.`) and calls `RejectReviewStepUseCase` the same way; `continue` writes the whole output with one `controller.state.updateOutput({ idWaits, state })` (`state` = the outcome's `state` when given, else the previous one, so the write is correct whether the store merges or replaces) and returns `controller.response.continue(input, { seconds: wait })` (input unchanged; a missing or zero `wait` means no delay; the platform ignores waits below one second). Only the handler writes the task output. Any other outcome type fails the step. When the use case fails the step fails with the fixed `The automation failed.` (its message is logged with `Logger.error`, never stored, R146); if the use case actually saved before failing (target sync) the step is no longer in review and the fail write below is discarded by the guard (the original reason is logged).
6. **One failure path (R146, R159).** Every failure above throws `StepRunFailure(reason)` (a new internal error class), caught once at the end of `run`: the review is read again, the guard is applied again (so a review that was cancelled meanwhile is not touched; the discarded reason is logged at info), `review.fail({ stepId, reason, now })` and `ReviewSaver.save`, then `done`. The reason is one of the fixed R146 texts; raw thrown messages (a throwing `run`, a failed use case) never reach the step: the handler logs the full error with `Logger.error` and throws `StepRunFailure("The automation failed.")`. An error that is not a `StepRunFailure` is returned as `controller.response.error(error)`: the `onError` hook (Task 11) fails the step through the same guard. A failed read, `fail` or save in this path is logged with `Logger.error` and returned as a task error, never ignored; a save that failed only in the target sync (R16) is logged too and still counts as written. The failure write is repeated inline here, as in the three hooks (the no-wrapper rule: dependency calls stay in the owning class).

**Runner identity (verified with CodeGraph, R161).** `TaskControl.run` loads the task and calls `IdentityContext.setIdentity(AuthenticatedIdentity from task.createdBy)` before anything else, so a running task already carries the requester (the trigger ran under `withIdentity(requester)`, R149). `TaskManager.run` then runs `definition.run` inside `withoutAuthorization` (D26: all task work runs without authorization, attributed to that identity), and the runner calls `onError` after the run, outside it; `onAbort` runs in whichever request aborts the task. The handler's own `withIdentity(requester)` is therefore explicit and idempotent in production (the stale guard already requires `task.createdBy.id === review.createdBy.id`), and it is what the test pins (the default test identity differs from the requester). It adds no authorization switch of its own, and `withIdentity` does not re-enable authorization: the automation and the engine calls it makes run with authorization OFF, attributed to the requester (D36, "an automation may change anything"). The requester's permissions are not applied; the test asserts only which identity is visible.

Contract notes: `controller.response.continue(data, { seconds })` is the platform's signature (R162, not `{ input, wait }`); the `AutomationOutcome` field stays `wait` and maps to `{ seconds: wait }`. The task output carries `{ idWaits, state }`, both written only by this handler.

Handler tests drive the class directly (R157): the container builds it with `resolveImplementation(WorkflowStepRunTaskHandler)`, the way the runner does, and Task 11's `FakeTaskController` stands in for the runner's controller. The test automation is Task 2's `TestAutomationDefinition` registered with `registerTestAutomation(container, overrides?)` (modes `approve`, `reject`, `wait`, `throw`); the bypass flag and the identity are observed from a small subclass of it, and an `ApproveReviewStepUseCase` decorator records the identity of the engine call.

**Files:**
- Create: `packages/api-workflows/src/features/stepRun/StepRunFailure.ts`
- Modify: `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskHandler.ts`
- Modify: `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts` (remove the placeholder `run` test)
- Create: `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts`

**Interfaces:**
- Consumes:
  - Task 11: `WorkflowStepRunTaskHandler` (`~/features/stepRun/WorkflowStepRunTask/index.js`; `TaskHandler.createImplementation`, constructor `(repository, saver, logger, definitions)`, `dependencies: [ReviewRepository, ReviewSaver, Logger, AutomationDefinitionRegistryService]`, the three hooks and `createInputValidation` stay unchanged), `createFakeTaskController` (`~tests/__helpers/FakeTaskController.js`), `getStaleStepRunReason(review: ReviewData, stepId: string, task: StepRunTaskIdentity): string | null` (`~/domain/review/getStaleStepRunReason.js`), the `TaskController` augmentation import already at the top of the handler file.
  - Task 9: `STEP_RUN_TASKID_WAIT_TRIES` (3), `STEP_RUN_TASKID_WAIT_SECONDS` (2), `DEFAULT_AUTOMATION_MAX_ITERATIONS` (50) (`~/features/stepRun/constants.js`), `StepRunTaskInput` (`~/features/stepRun/types.js`); test seams `resetFakeTasks`, `FailingReviewSave` / `reviewSaveFaults`.
  - Task 8: `WorkflowBypassService` (`~/features/bypass/WorkflowBypassService/index.js`): `run<T>(callback: () => Promise<T>): Promise<T>`, `isActive(): boolean`.
  - Task 5: `getAutomationActor(requester: Actor): Actor`, `Review.reachRun`, `Review.fail`, `Review.cancel`; helpers `AUTOMATION_STEP_ID`, `automationActor` (`~tests/__helpers/stepRunReviews.js`).
  - Task 2: `AutomationDefinitionRegistryService` (`~/features/automation/AutomationDefinitionRegistryService/index.js`, `get(id)`), `automationStepConfigSchema` (`~/domain/automation/automationStepConfigSchema.js`), `parseAutomationSettings(definition, settings): Result<unknown, string>` (`~/domain/automation/parseAutomationSettings.js`, fail message `"<path>: <message>"`), `AutomationDefinition` (`~/features/automation/AutomationDefinition/index.js`: `Interface`, `Outcome`, `RunParams`), test helpers `TestAutomationDefinition` (`runCalls`; `approve` / `reject` answer with the settings' comment, `wait` answers `{ type: "continue", wait: 1, state: { iterations: iteration } }`, `throw` throws `Error("The test automation threw.")`), `TestAutomationSettings`, `TestAutomationOverrides`, `registerTestAutomation(container, overrides?)`, `createAutomationStep` (`~tests/__helpers/TestAutomationDefinition.js`).
  - Existing: `IdentityContext`, `AuthenticatedIdentity` (`@webiny/api-core/features/security/IdentityContext/index.js`; `withIdentity<T>(identity, cb)`, `getIdentity()`), `ApproveReviewStepUseCase`, `RejectReviewStepUseCase` (`execute(input: ReviewDecisionInput)`: `reviewId`, `stepId`, `actor`, `actorTeamIds`, `comment?`), `REJECT_COMMENT_MIN_LENGTH` (`~/domain/review/Review.js`), `ReviewNotFoundError`, `ReviewTargetSyncError` (`~/domain/review/errors.js`), `ReviewRepository`, `ReviewSaver`, `Logger`, `ReviewStep` (`~/domain/review/types.js`), `createWorkflow`, `createReviewStep`, `expectOk`, `NOW`, `requester`, `targetContext`, `ARTICLE_MODEL`, `toSaveData` (`~tests/__helpers/fixtures.js`), `captureLoggedErrors` / `loggedErrors`, `RecordingEventPublisher` / `recordedEvents` / `workflowEventTypes`.
  - Platform (`@webiny/background-tasks`, `@webiny/api-core`): `controller.state.getTask()` (`id`, `iterations` starting at 1 on the first run, `createdBy.id`), `controller.state.getOutput()`, `controller.state.updateOutput(values)`, `controller.response.done()`, `.continue(input, { seconds })`, `.error(error)`; `TaskResultStatus` (`@webiny/api-core/features/task/TaskDefinition/index.js`).
- Produces (matches the contract):
  - `WorkflowStepRunTaskHandler.run(params)` with the behaviour above, and `StepRunFailure` (`~/features/stepRun/StepRunFailure.js`, internal). The handler gains the dependencies `ApproveReviewStepUseCase`, `RejectReviewStepUseCase`, `WorkflowBypassService`, `IdentityContext`, appended after Task 11's four (`AutomationDefinitionRegistryService` is already there). Consumed by the tests of Tasks 14-17 only through task state (the handler never exports anything else).

- [ ] **Step 1: Write the failing tests**

`FakeTaskController` (`createFakeTaskController`, created in Task 11) is reused as it is; `continue(data, { seconds })` is the platform's signature (R162).

Create `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import type { TaskHandler } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { FailingReviewSave, reviewSaveFaults } from "~tests/__helpers/FailingReviewSave.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    createFakeTaskController,
    type FakeTaskControllerParams
} from "~tests/__helpers/FakeTaskController.js";
import {
    createAutomationStep,
    registerTestAutomation,
    TestAutomationDefinition,
    type TestAutomationOverrides,
    type TestAutomationSettings
} from "~tests/__helpers/TestAutomationDefinition.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import { AUTOMATION_STEP_ID, automationActor } from "~tests/__helpers/stepRunReviews.js";
import {
    ARTICLE_MODEL,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    targetContext,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { Review } from "~/domain/review/Review.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { WorkflowStepRunTaskHandler } from "~/features/stepRun/WorkflowStepRunTask/index.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";

const LATER = "2026-10-09T11:00:00.000Z";

/** The one-step workflow "Check links": approving the step approves the review. */
const createReview = (
    settings: Record<string, unknown> = {},
    taskId: string | null = "task-1"
): Review => {
    const review = expectOk(
        Review.request({
            id: "review-1",
            workflow: createWorkflow({
                steps: [
                    createAutomationStep({
                        id: AUTOMATION_STEP_ID,
                        title: "Check links",
                        settings
                    })
                ]
            }),
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            targetContext,
            picks: [],
            requester,
            now: NOW
        })
    );
    expectOk(review.reachRun({ actor: requester, owner: automationActor, taskId, now: NOW }));
    return review;
};

const createCancelledReview = (): Review => {
    const review = createReview();
    review.pullFacts();
    expectOk(review.cancel({ actor: requester, now: LATER }));
    return review;
};

const createApprovedReview = (): Review => {
    const review = createReview();
    expectOk(
        review.approve({
            stepId: AUTOMATION_STEP_ID,
            actor: automationActor,
            actorTeamIds: [],
            comment: null,
            now: LATER
        })
    );
    return review;
};

/** Records whether the bypass was active and who the identity was while the automation ran. */
class RunProbeDefinition extends TestAutomationDefinition {
    public readonly activeDuringRun: boolean[] = [];
    public readonly identityDuringRun: string[] = [];

    public constructor(
        private bypass: WorkflowBypassService.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        super();
    }

    public override async run(
        params: AutomationDefinition.RunParams<TestAutomationSettings>
    ): Promise<AutomationDefinition.Outcome> {
        this.activeDuringRun.push(this.bypass.isActive());
        this.identityDuringRun.push(this.identityContext.getIdentity().id);
        return super.run(params);
    }
}

class UnknownOutcomeDefinition extends TestAutomationDefinition {
    public override async run(): Promise<AutomationDefinition.Outcome> {
        return { type: "nonsense" } as unknown as AutomationDefinition.Outcome;
    }
}

/** The identity in force at every `ApproveReviewStepUseCase.execute` call of the handler. */
const approveIdentities: string[] = [];

class ApproveIdentityProbeImpl implements ApproveReviewStepUseCase.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private decoratee: ApproveReviewStepUseCase.Interface
    ) {}

    public execute(input: ApproveReviewStepUseCase.Input): ApproveReviewStepUseCase.Return {
        approveIdentities.push(this.identityContext.getIdentity().id);
        return this.decoratee.execute(input);
    }
}

const ApproveIdentityProbe = ApproveReviewStepUseCase.createDecorator({
    decorator: ApproveIdentityProbeImpl,
    dependencies: [IdentityContext]
});

interface SetupParams {
    /** Overrides of the default test automation (`registerTestAutomation`). */
    overrides?: TestAutomationOverrides;
    /** Replaces the default test automation with this one. */
    custom?: (
        bypass: WorkflowBypassService.Interface,
        identityContext: IdentityContext.Interface
    ) => TestAutomationDefinition;
    /** Registers no automation at all. */
    none?: boolean;
}

const DEFINITION = {
    id: "workflowsStepRun",
    title: "Workflow step run",
    isPrivate: true,
    maxIterations: 10000
};

const INPUT: StepRunTaskInput = { reviewId: "review-1", stepId: AUTOMATION_STEP_ID };

const setup = async (params: SetupParams = {}) => {
    let registered: TestAutomationDefinition | null = null;
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FailingReviewSave);
            container.registerDecorator(RecordingEventPublisher);
            container.registerDecorator(ApproveIdentityProbe);
            if (!params.custom && !params.none) {
                registered = registerTestAutomation(container, params.overrides);
            }
        }
    });
    const bypass = context.container.resolve(WorkflowBypassService);
    const identityContext = context.container.resolve(IdentityContext);
    const definition = params.custom ? params.custom(bypass, identityContext) : registered;
    if (params.custom) {
        context.container.registerInstance(AutomationDefinition, definition!);
    }
    const handler = context.container.resolveImplementation(
        WorkflowStepRunTaskHandler
    ) as TaskHandler.Interface<StepRunTaskInput>;
    const repository = context.container.resolve(ReviewRepository);
    const saver = context.container.resolve(ReviewSaver);

    return {
        bypass,
        identityContext,
        definition: definition as TestAutomationDefinition,
        read: async (): Promise<ReviewData> => expectOk(await repository.get("review-1")),
        seed: async (review: Review): Promise<void> => {
            expectOk(await saver.save(review));
            recordedEvents.length = 0;
        },
        seedData: async (data: ReviewData): Promise<void> => {
            expectOk(await repository.save(data));
        },
        /** Cancels the stored review, as a requester would while the automation runs. */
        cancel: async (): Promise<void> => {
            const review = Review.fromData(expectOk(await repository.get("review-1")));
            expectOk(review.cancel({ actor: requester, now: LATER }));
            expectOk(await saver.save(review));
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

describe("workflowsStepRun run handler (R142-R146, R148, R161-R163)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
        recordedEvents.length = 0;
        approveIdentities.length = 0;
        reviewSaveFaults.failNext = false;
    });

    describe("waits for the review and the step to carry its task id (R143, R163)", () => {
        it.each([
            { name: "the review is not found yet", build: null },
            { name: "the step carries another task id", build: () => createReview({}, "task-other") },
            { name: "the step carries no task id yet", build: () => createReview({}, null) }
        ])(
            "waits for the review and step to carry its task id, at most 3 tries ($name)",
            async ({ build }) => {
                const { run, seed, read, definition } = await setup();
                if (build) {
                    await seed(build());
                }
                const before = build ? await read() : null;

                for (const iterations of [1, 2, 3]) {
                    const waiting = run({ iterations });
                    await expect(waiting.result).resolves.toEqual({
                        status: "continue",
                        input: INPUT,
                        wait: 2
                    });
                    expect(waiting.outputUpdates).toEqual([]);
                }
                const finished = run({ iterations: 4 });

                await expect(finished.result).resolves.toMatchObject({ status: "done" });
                expect(definition.runCalls).toEqual([]);
                expect(workflowEventTypes()).toEqual([]);
                expect(loggedErrors).toEqual([]);
                if (before) {
                    expect(await read()).toEqual(before);
                }
            }
        );

        it.each([
            { name: "the review was cancelled", build: createCancelledReview, createdById: undefined },
            { name: "the step was already approved", build: createApprovedReview, createdById: undefined },
            {
                name: "the task was not created by the requester",
                build: () => createReview(),
                createdById: "user-intruder"
            }
        ])(
            "ends at once, without a wait, for a guard failure that is not a missing task id ($name, R163)",
            async ({ build, createdById }) => {
                const { run, seed, definition } = await setup();
                await seed(build());

                const { result } = run({ iterations: 1, createdById });

                await expect(result).resolves.toMatchObject({ status: "done" });
                expect(definition.runCalls).toEqual([]);
                expect(workflowEventTypes()).toEqual([]);
            }
        );

        it("runs as soon as the review and step carry its task id, with iteration 1 after the waits (R163)", async () => {
            const { run, seed, read, definition } = await setup();
            await seed(createReview({ comment: "Links are fine." }));

            const { result } = run({ iterations: 3 });

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect((await read()).state).toBe("approved");
            expect(definition.runCalls.map(call => call.iteration)).toEqual([1]);
        });
    });

    describe("runs the automation and applies the outcome (R135, R141)", () => {
        it("approves as the automation actor with the parsed settings and the comment", async () => {
            const { run, seed, read, definition } = await setup();
            await seed(createReview({ comment: "Links are fine." }));

            const { result } = run({ iterations: 1 });

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored).toMatchObject({ state: "approved", currentStepState: "approved" });
            expect(stored.steps[0]).toMatchObject({
                state: "approved",
                comment: "Links are fine.",
                owner: automationActor,
                taskId: "task-1"
            });
            expect(definition.runCalls).toHaveLength(1);
            expect(definition.runCalls[0]).toMatchObject({
                settings: { mode: "approve", comment: "Links are fine." },
                iteration: 1,
                state: null
            });
            expect(definition.runCalls[0].review.id).toBe("review-1");
            expect(definition.runCalls[0].step.id).toBe(AUTOMATION_STEP_ID);
            expect(workflowEventTypes()).toEqual([
                "Workflows/Review/StepApproved",
                "Workflows/Review/Approved"
            ]);
            const approved = recordedEvents.find(
                event => event.eventType === "Workflows/Review/StepApproved"
            );
            expect(approved?.payload.fact.actor).toEqual(automationActor);
        });

        it("rejects as the automation actor with the comment", async () => {
            const { run, seed, read } = await setup();
            await seed(createReview({ mode: "reject", comment: "The links are broken." }));

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored).toMatchObject({ state: "rejected", currentStepState: "rejected" });
            expect(stored.steps[0]).toMatchObject({
                state: "rejected",
                comment: "The links are broken.",
                owner: automationActor
            });
            const rejected = recordedEvents.find(
                event => event.eventType === "Workflows/Review/StepRejected"
            );
            expect(rejected?.payload.fact.actor).toEqual(automationActor);
        });

        it.each([
            { name: "no comment", settings: { mode: "reject" } },
            {
                name: "a comment shorter than 10 characters",
                settings: { mode: "reject", comment: "No." }
            }
        ])("fails the step when it rejects with $name (D100)", async ({ settings }) => {
            const { run, seed, read } = await setup();
            await seed(createReview(settings));

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored).toMatchObject({ state: "inProgress", currentStepState: "failed" });
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: "The automation rejected without a comment."
            });
            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        });

        it("continues with the delay, writes the state and the wait count, and hands the state to the next iteration", async () => {
            const { run, seed, read, definition } = await setup();
            await seed(createReview({ mode: "wait" }));

            // One wait for the task id (task iteration 1), then the first run (task iteration 2).
            const first = run({ iterations: 2 });
            const firstResult = await first.result;
            const second = run({
                iterations: 3,
                output: { idWaits: 1, state: { iterations: 1 } }
            });
            const secondResult = await second.result;

            expect(firstResult).toEqual({ status: "continue", input: INPUT, wait: 1 });
            expect(first.outputUpdates).toEqual([{ idWaits: 1, state: { iterations: 1 } }]);
            expect(secondResult).toEqual({ status: "continue", input: INPUT, wait: 1 });
            expect(second.outputUpdates).toEqual([{ idWaits: 1, state: { iterations: 2 } }]);
            expect(definition.runCalls.map(call => call.state)).toEqual([null, { iterations: 1 }]);
            expect(definition.runCalls.map(call => call.iteration)).toEqual([1, 2]);
            const stored = await read();
            expect(stored.steps[0]).toMatchObject({ state: "inReview", comment: null });
            expect(workflowEventTypes()).toEqual([]);
        });

        it("returns the task error when it cannot write the output, without touching the review", async () => {
            const { run, seed, read } = await setup();
            await seed(createReview({ mode: "wait" }));
            const before = await read();

            const { result } = run({ outputUpdateError: new Error("Output is not writable.") });

            await expect(result).resolves.toEqual({
                status: "error",
                error: { message: "Output is not writable." }
            });
            expect(await read()).toEqual(before);
        });
    });

    describe("fails the step with a fixed reason (D8, R146, Review Focus 4)", () => {
        const expectFailed = async (
            read: () => Promise<ReviewData>,
            reason: string | RegExp
        ): Promise<void> => {
            const stored = await read();
            expect(stored).toMatchObject({ state: "inProgress", currentStepState: "failed" });
            expect(stored.steps[0]).toMatchObject({ state: "failed", owner: automationActor });
            if (typeof reason === "string") {
                expect(stored.steps[0].comment).toBe(reason);
            } else {
                expect(stored.steps[0].comment).toMatch(reason);
            }
            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        };

        it("when the automation is missing", async () => {
            const { run, seed, read } = await setup({ none: true });
            await seed(createReview());

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, 'The automation "test-automation" is not available.');
        });

        it("when the stored settings are not valid, without running the automation", async () => {
            const { run, seed, read, definition } = await setup();
            await seed(createReview({ mode: "nonsense" }));

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, /^The automation settings are not valid: mode: /);
            expect(definition.runCalls).toEqual([]);
        });

        it("when the step config no longer parses, with its own reason (P3)", async () => {
            const { run, seedData, read, definition } = await setup();
            const data = toSaveData(createReview());
            data.steps[0].config = { settings: {} };
            await seedData(data);

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The automation step configuration is not valid.");
            expect(definition.runCalls).toEqual([]);
        });

        it("when the automation ran past its own limit, counting runs and not waits (R145, R163, P4, P7)", async () => {
            const { run, seed, read, definition } = await setup({ overrides: { maxIterations: 2 } });
            await seed(createReview({ mode: "wait" }));

            // Three waits for the task id, then three runs: the third run exceeds the limit of 2.
            const first = run({ iterations: 4 });
            await first.result;
            const second = run({ iterations: 5, output: { idWaits: 3, state: { iterations: 1 } } });
            await second.result;
            const exceeded = run({ iterations: 6, output: { idWaits: 3, state: { iterations: 2 } } });

            await expect(exceeded.result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The automation did not finish in 2 iterations.");
            expect(definition.runCalls.map(call => call.iteration)).toEqual([1, 2]);
        });

        it("when the automation ran past the default of 50 runs (R145)", async () => {
            const { run, seed, read, definition } = await setup();
            await seed(createReview({ mode: "wait" }));

            const { result } = run({ iterations: 51, output: { idWaits: 0 } });

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The automation did not finish in 50 iterations.");
            expect(definition.runCalls).toEqual([]);
        });

        it("when the automation throws, and restores the bypass flag", async () => {
            const { run, seed, read, bypass } = await setup({
                custom: (probe, identity) => new RunProbeDefinition(probe, identity)
            });
            await seed(createReview({ mode: "throw" }));

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The automation failed.");
            expect(bypass.isActive()).toBe(false);
            // The raw message is logged, never stored (R146).
            expect(loggedErrors.map(logged => logged.message)).toEqual(["The automation threw."]);
            expect((loggedErrors[0].fields.error as Error).message).toBe("The test automation threw.");
        });

        it("when the automation returns an unknown outcome", async () => {
            const { run, seed, read } = await setup({ custom: () => new UnknownOutcomeDefinition() });
            await seed(createReview());

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The automation failed: It returned an unknown outcome.");
        });

        it("when the outcome cannot be saved", async () => {
            const { run, seed, read } = await setup();
            await seed(createReview());
            reviewSaveFaults.failNext = true;

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The automation failed.");
            expect(loggedErrors.map(logged => logged.message)).toContain(
                "Applying the automation outcome failed."
            );
        });

        it("never puts a raw error message into the step, however long", async () => {
            const { run, seed, read } = await setup({
                custom: () => {
                    const definition = new TestAutomationDefinition();
                    definition.run = async () => {
                        throw new Error("x".repeat(600));
                    };
                    return definition;
                }
            });
            await seed(createReview());

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored.steps[0].comment).toBe("The automation failed.");
            expect(JSON.stringify(stored)).not.toContain("xxxxx");
            expect((loggedErrors[0].fields.error as Error).message).toBe("x".repeat(600));
        });

        it("writes nothing when the review was cancelled while the automation ran", async () => {
            const { run, seed, read, cancel, definition } = await setup();
            await seed(createReview());
            // The cancel lands after the guard passed and before the failure would be written.
            definition.run = async () => {
                await cancel();
                throw new Error("The automation failed after the cancel.");
            };

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored.state).toBe("cancelled");
            expect(stored.steps[0].state).toBe("inReview");
            expect(workflowEventTypes()).toEqual(["Workflows/Review/Cancelled"]);
            expect(loggedErrors).toEqual([]);
        });
    });

    describe("runs as the requester (R161, D58, D87)", () => {
        it("lets the automation and the approve call see the requester identity, and restores the outer one", async () => {
            const { run, seed, identityContext, definition } = await setup({
                custom: (bypass, identity) => new RunProbeDefinition(bypass, identity)
            });
            await seed(createReview());
            const outer = identityContext.getIdentity().id;

            const { result } = run();
            await result;

            expect(outer).not.toBe(requester.id);
            expect((definition as RunProbeDefinition).identityDuringRun).toEqual([requester.id]);
            expect(approveIdentities).toEqual([requester.id]);
            expect(identityContext.getIdentity().id).toBe(outer);
        });
    });

    describe("keeps the bypass for the automation call only (D36, R150, Review Focus 3)", () => {
        it("is active while the automation runs and off before and after", async () => {
            const { run, seed, bypass, definition } = await setup({
                custom: (probe, identity) => new RunProbeDefinition(probe, identity)
            });
            await seed(createReview());
            expect(bypass.isActive()).toBe(false);

            const { result } = run();
            await result;

            expect((definition as RunProbeDefinition).activeDuringRun).toEqual([true]);
            expect(bypass.isActive()).toBe(false);
        });
    });

    describe("never trusts its input (SEC-68, R148)", () => {
        it("reads the step's definition and settings from the review, not from the input", async () => {
            const { run, seed, definition } = await setup();
            await seed(createReview({ mode: "approve", comment: "From the review snapshot." }));

            const { result } = run({
                input: { ...INPUT, automationId: "other", settings: { mode: "throw" } } as never
            });
            await result;

            expect(definition.runCalls).toHaveLength(1);
            expect(definition.runCalls[0].settings).toMatchObject({
                mode: "approve",
                comment: "From the review snapshot."
            });
        });
    });
});
```

In `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts` (Task 11), delete the `describe("workflowsStepRun run (placeholder until Task 12)", ...)` block and the `createFakeTaskController` import that only it used: `run` is no longer a placeholder, and the new file covers it.

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts 2>&1 | tail -50`
Expected: FAIL. The placeholder `run` returns done without reading anything: every wait test fails (`done` instead of `continue`), every outcome and failure test finds the step still `inReview`.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: The failure error and the handler**

Create `packages/api-workflows/src/features/stepRun/StepRunFailure.ts`:

```ts
/**
 * Thrown inside the step run handler to fail the step with a fixed reason (R146). `run` catches it
 * and writes the failure once; it never leaves the handler.
 */
export class StepRunFailure extends Error {
    public constructor(public readonly reason: string) {
        super(reason);
        this.name = "StepRunFailure";
    }
}
```

In `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskHandler.ts` (as Task 11 left it) replace the import block, the class doc comment, the constructor and `run`, and the `dependencies` array. `createInputValidation` and the three hooks stay exactly as they are.

The import block becomes:

```ts
import "@webiny/background-tasks/api/features/TaskController/augmentation.js";
import {
    TaskHandler,
    type TaskDefinition
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import {
    AuthenticatedIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { Review, REJECT_COMMENT_MIN_LENGTH } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewTargetSyncError } from "~/domain/review/errors.js";
import { getStaleStepRunReason } from "~/domain/review/getStaleStepRunReason.js";
import type { ReviewStep } from "~/domain/review/types.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";
import type { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import {
    DEFAULT_AUTOMATION_MAX_ITERATIONS,
    STEP_RUN_TASKID_WAIT_SECONDS,
    STEP_RUN_TASKID_WAIT_TRIES
} from "../constants.js";
import { StepRunFailure } from "../StepRunFailure.js";
import type { StepRunTaskInput } from "../types.js";

type RunParams = TaskHandler.RunParams<StepRunTaskInput>;
type HookParams = TaskHandler.LifecycleHookParams<StepRunTaskInput>;
```

The class doc comment, constructor and `run` become:

```ts
/**
 * Runs one automation step (spec 7.4, R142). `run` reads the review, applies the stale guard (a
 * forged, foreign or restarted task writes nothing, R144, R148), waits a few iterations for its
 * task id to appear on the step (R143), runs the automation as the requester inside the bypass
 * (R150, R161) and applies its outcome through the base approve and reject use cases as the
 * automation actor (R141). Every failure fails the step once, with a fixed reason (R146). The
 * failure hooks fail the step when the runner reports an error, the iteration ceiling or an abort.
 * Every write is guarded; a hook never throws.
 */
class WorkflowStepRunTaskHandlerImpl implements TaskHandler.Interface<StepRunTaskInput> {
    public constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface,
        private logger: Logger.Interface,
        private definitions: AutomationDefinitionRegistryService.Interface,
        private approveStep: ApproveReviewStepUseCase.Interface,
        private rejectStep: RejectReviewStepUseCase.Interface,
        private bypass: WorkflowBypassService.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    public async run({ input, controller }: RunParams) {
        const { reviewId, stepId } = input;
        const task = controller.state.getTask();

        // 1. Read and guard. The input is never trusted beyond the two ids (R148).
        const loaded = await this.repository.get(reviewId);
        if (loaded.isFail() && !(loaded.error instanceof ReviewNotFoundError)) {
            this.logger.error(
                { error: loaded.error, taskId: task.id, reviewId, stepId },
                "Could not read the review in a step run."
            );
            return controller.response.error(loaded.error);
        }
        const data = loaded.isOk() ? loaded.value : null;
        const stale = data
            ? getStaleStepRunReason(data, stepId, {
                  id: task.id,
                  createdById: task.createdBy.id
              })
            : "The review was not found.";

        // 2. The trigger runs before the save, so only two cases wait: the review does not exist
        // yet, or it is active and in progress and the step does not carry this task's id yet.
        // Any other guard result ends the task at once (R143, R163).
        if (!data || stale) {
            const step = data ? data.steps.find(item => item.id === stepId) : undefined;
            const taskIdNotSaved =
                !data ||
                (data.isActive &&
                    data.state === "inProgress" &&
                    step !== undefined &&
                    step.taskId !== task.id);
            if (taskIdNotSaved && task.iterations <= STEP_RUN_TASKID_WAIT_TRIES) {
                return controller.response.continue(input, {
                    seconds: STEP_RUN_TASKID_WAIT_SECONDS
                });
            }
            this.logger.info(
                { taskId: task.id, reviewId, stepId, stale },
                "Ignored a stale step run."
            );
            return controller.response.done();
        }
        // The guard passed, so the step exists.
        const step = data.steps.find(item => item.id === stepId) as ReviewStep;

        // Everything from here on acts as the requester (D58, D87, R161). The runner already
        // restored `task.createdBy` (the requester, checked by the guard) and runs the handler
        // under `withoutAuthorization` (D36: an automation may change anything); this makes the
        // identity explicit (attribution only) and does not switch authorization back on, so the
        // requester's permissions are not applied.
        const requester = data.createdBy;
        const identity = new AuthenticatedIdentity({
            id: requester.id,
            displayName: requester.displayName,
            type: requester.identityType ?? "admin",
            context: { canAccessTenant: true }
        });

        return this.identityContext.withIdentity(identity, async () => {
            try {
                // 3. Look up and validate everything from the review snapshot (A53, R148).
                const config = automationStepConfigSchema.safeParse(step.config);
                if (!config.success) {
                    throw new StepRunFailure("The automation step configuration is not valid.");
                }
                const automationId = config.data.automationId;
                const definition = this.definitions.get(automationId);
                if (!definition) {
                    throw new StepRunFailure(`The automation "${automationId}" is not available.`);
                }
                // `iteration` counts automation runs, never the waits for the task id (R163).
                const output = controller.state.getOutput();
                const idWaits = typeof output?.idWaits === "number" ? output.idWaits : task.iterations - 1;
                const iteration = task.iterations - idWaits;
                const maxIterations = definition.maxIterations ?? DEFAULT_AUTOMATION_MAX_ITERATIONS;
                if (iteration > maxIterations) {
                    throw new StepRunFailure(
                        `The automation did not finish in ${maxIterations} iterations.`
                    );
                }
                const settings = parseAutomationSettings(definition, config.data.settings);
                if (settings.isFail()) {
                    throw new StepRunFailure(
                        `The automation settings are not valid: ${settings.error}.`
                    );
                }

                // 4. Run inside the bypass, and only there (D36, R150).
                const state = (output?.state ?? null) as Record<string, unknown> | null;
                let outcome: AutomationDefinition.Outcome;
                try {
                    outcome = await this.bypass.run(() =>
                        definition.run({
                            settings: settings.value,
                            review: data,
                            step,
                            iteration,
                            state
                        })
                    );
                } catch (error) {
                    // The raw message can carry internals: logged, never stored (R146).
                    this.logger.error(
                        { error, taskId: task.id, reviewId, stepId },
                        "The automation threw."
                    );
                    throw new StepRunFailure("The automation failed.");
                }

                // 5. Apply the outcome as the automation actor (R135, R141).
                switch (outcome.type) {
                    case "approved": {
                        const approved = await this.approveStep.execute({
                            reviewId,
                            stepId,
                            actor: getAutomationActor(requester),
                            actorTeamIds: [],
                            comment: outcome.comment
                        });
                        if (approved.isFail()) {
                            this.logger.error(
                                { error: approved.error, taskId: task.id, reviewId, stepId },
                                "Applying the automation outcome failed."
                            );
                            throw new StepRunFailure("The automation failed.");
                        }
                        return controller.response.done();
                    }
                    case "rejected": {
                        const comment = (outcome.comment ?? "").trim();
                        if (comment.length < REJECT_COMMENT_MIN_LENGTH) {
                            throw new StepRunFailure("The automation rejected without a comment.");
                        }
                        const rejected = await this.rejectStep.execute({
                            reviewId,
                            stepId,
                            actor: getAutomationActor(requester),
                            actorTeamIds: [],
                            comment
                        });
                        if (rejected.isFail()) {
                            this.logger.error(
                                { error: rejected.error, taskId: task.id, reviewId, stepId },
                                "Applying the automation outcome failed."
                            );
                            throw new StepRunFailure("The automation failed.");
                        }
                        return controller.response.done();
                    }
                    case "continue": {
                        // One whole write of what this handler keeps in the task output (R135,
                        // R163): the wait count and the automation's state.
                        await controller.state.updateOutput({
                            idWaits,
                            state: outcome.state !== undefined ? outcome.state : state
                        });
                        return controller.response.continue(
                            input,
                            outcome.wait ? { seconds: outcome.wait } : undefined
                        );
                    }
                    default:
                        throw new StepRunFailure(
                            "The automation failed: It returned an unknown outcome."
                        );
                }
            } catch (error) {
                if (!(error instanceof StepRunFailure)) {
                    return controller.response.error(
                        error instanceof Error ? error : new Error(String(error))
                    );
                }

                // 6. The one failure path (R146, R159): read again, guard again (a review
                // cancelled meanwhile, or whose outcome did get saved, is not touched), fail the
                // step, save. Nothing is ignored silently: every skipped or failed write is logged.
                const current = await this.repository.get(reviewId);
                if (current.isFail()) {
                    this.logger.error(
                        { error: current.error, taskId: task.id, reviewId, stepId },
                        "Could not read the review to fail the step."
                    );
                    return controller.response.error(current.error);
                }
                const staleNow = getStaleStepRunReason(current.value, stepId, {
                    id: task.id,
                    createdById: task.createdBy.id
                });
                if (staleNow) {
                    this.logger.info(
                        { taskId: task.id, reviewId, stepId, stale: staleNow, reason: error.reason },
                        "Ignored a stale step run failure."
                    );
                    return controller.response.done();
                }
                const review = Review.fromData(current.value);
                const failed = review.fail({
                    stepId,
                    reason: error.reason,
                    now: new Date().toISOString()
                });
                if (failed.isFail()) {
                    this.logger.error(
                        { error: failed.error, taskId: task.id, reviewId, stepId },
                        "Could not fail the step after a step run failure."
                    );
                    return controller.response.error(failed.error);
                }
                const saved = await this.saver.save(review);
                if (saved.isFail()) {
                    this.logger.error(
                        { error: saved.error, taskId: task.id, reviewId, stepId },
                        "Could not save the failed step after a step run failure."
                    );
                    // A failed target sync still saved the failed step (R16).
                    if (!(saved.error instanceof ReviewTargetSyncError)) {
                        return controller.response.error(saved.error);
                    }
                }
                return controller.response.done();
            }
        });
    }
```

`createInputValidation`, `onError`, `onMaxIterations` and `onAbort` follow unchanged from Task 11 (the hooks use the four constructor members of Task 11 only). The last statement of the file becomes:

```ts
export const WorkflowStepRunTaskHandler = TaskHandler.createImplementation({
    implementation: WorkflowStepRunTaskHandlerImpl,
    dependencies: [
        ReviewRepository,
        ReviewSaver,
        Logger,
        AutomationDefinitionRegistryService,
        ApproveReviewStepUseCase,
        RejectReviewStepUseCase,
        WorkflowBypassService,
        IdentityContext
    ]
});
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows|background-tasks" | head`
Expected: no output.

- [ ] **Step 5: Run the existing tests covering the changed code**

The handler file also holds Task 11's hooks and the registration; the handler now resolves the approve and reject use cases and the bypass service:

Run: `yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/bypass/WorkflowBypassService.test.ts packages/api-workflows/__tests__/registration.test.ts packages/api-workflows/__tests__/review/ReviewTransitions.test.ts packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/bypass/WorkflowBypassService.test.ts packages/api-workflows/__tests__/registration.test.ts packages/api-workflows/__tests__/review/ReviewTransitions.test.ts packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): run automation steps in the workflowsStepRun handler and apply their outcome

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
