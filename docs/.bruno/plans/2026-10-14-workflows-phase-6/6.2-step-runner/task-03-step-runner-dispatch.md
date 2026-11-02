### Task 3: `StepRunner`, registry, `AutomationStepRunner`, handler dispatch

Spec 5.1, 7.4; D7, D27, D36, D55, D87, D100; R135, R141, R142, R143, R144, R145, R146, R148, R150, R161, R163, R168; A53; Review Focus 1 (guard parity) and 5 (the refactor changes no automation behaviour). The phase 5 `WorkflowStepRunTaskHandler.run` is the engine of an automation step; this task makes it step-type neutral without changing one automation byte. Steps 3 and 4 of the phase 5 handler (look up and validate, run inside the bypass) move into a new `AutomationStepRunner`; the handler picks the runner by `step.type` and keeps everything shared.

- **`StepRunner` abstraction** (`features/stepRun/StepRunner/`, multi-registered, R168): `type`, `singleRun`, `failureReasons { error; aborted; stuck }`, `maxIterationsReason(step)`, `getActor(requester)`, `run(params)`. `run` returns `approved | rejected | continue`; a failure is a thrown `StepRunFailure` (R146). `StepRunnerRunParams` carries `review`, `step`, `requester`, `task: StepRunTaskIdentity`, `iteration`, `state`, `signal`. It has no `isStale`: a runner that must notice a cancel or restart during a long call uses the DI service `StepRunStaleCheckService` (Task 4), and throttles and sticks its own answer (the AI runner, Task 19, R175).
- **`StepRunnerRegistryService`** (`get(type)`, `list()`; the last registration per `type` wins and keeps the first one's place, like every registry here).
- **`AutomationStepRunner`** (`type: "automation"`, `singleRun: false`, `failureReasons { error: "The automation failed.", aborted: "The automation was aborted.", stuck: "The automation task ended without a result." }`, `getActor` = `getAutomationActor`, `maxIterationsReason` from the definition's own limit, default 50, R145). Its `run` is the phase 5 code moved as it is: config parse (`The automation step configuration is not valid.`), definition lookup (`The automation "<id>" is not available.`), iteration cap (`The automation did not finish in <n> iterations.`), settings parse (`The automation settings are not valid: <path>: <message>.`), `bypass.run(definition.run)` (R150), a throwing definition logged with `"The automation threw."` and the context `{ error, taskId, reviewId, stepId }` (rebuilt from `task.id`, `review.id`, `step.id`: the same keys and values as phase 5) and turned into `The automation failed.`. The outcome check that phase 5 did in the handler moves in too, because only the runner knows its texts: a `rejected` outcome with a trimmed comment shorter than `REJECT_COMMENT_MIN_LENGTH` throws `The automation rejected without a comment.` (the runner returns the trimmed comment), an unknown outcome type throws `The automation failed: It returned an unknown outcome.`.
- **The handler** keeps: read, guard, id wait, identity (R161), `iteration` / `state` from the task output (R163), the post-run re-guard with its log messages (`"Ignored a stale step run outcome."`, `"Could not read the review to apply the automation outcome."`), applying `approved` / `rejected` / `continue`, and the one failure path. It now picks `runner = runners.get(step.type)` from the review snapshot (R148, A53); a type with no runner throws `StepRunFailure('The step type "<type>" is not available.')` through the one failure path. Approve and reject use `actor: runner.getActor(requester)` and `actorTeamIds: []`; every failure reason that the handler itself raised with an automation text now comes from `runner.failureReasons.error` (for automation: `The automation failed.`, byte for byte). The handler no longer depends on `WorkflowBypassService` (the runner owns the bypass). The log message `"Applying the automation outcome failed."` stays as it is: phase 5 tests pin it.
- **Placeholder until Task 4:** `signal` is an unaborted `AbortSignal` (`new AbortController().signal`). The hooks (`onError`, `onAbort`, `onMaxIterations`) keep the phase 5 automation texts and the `AutomationDefinitionRegistryService` dependency; Task 4 makes them runner-aware. The pre-run output write for `singleRun` runners (R170) is Task 4's: this task only declares the member, and no registered runner has `singleRun` true yet.
- **Behaviour that stays byte for byte** (Review Focus 5): every phase 5 fail reason, guard, id wait, `outputUpdates` write (only on `continue`), hook and stuck rule; `WorkflowStepRunTaskRun.test.ts`, `WorkflowStepRunTask.test.ts` and `StuckStepService.test.ts` run unchanged. One accepted micro difference, covered by no phase 5 test: a stale task that also returned a too-short reject comment or an unknown outcome now takes the failure path (info log `"Ignored a stale step run failure."`, nothing written) instead of the outcome path (`"Ignored a stale step run outcome."`, nothing written); both write nothing, and such a run makes one repository read fewer (the post-run re-read of the review no longer happens, because the runner throws before it). A step of a type that has no runner now fails with `The step type "<type>" is not available.`; before, the handler never looked at the type.
- **Registration:** `StepRunnerRegistryFeature` and `AutomationStepRunnerFeature` are registered by `WorkflowsFeature` next to `WorkflowStepRunTaskFeature`. Later sub-phases register their own runners with `container.register(<Runner>)` or, in tests, `container.registerInstance(StepRunner, runner)`.

Pinned by tests: registration of the registry and the automation runner, dispatch by type (the runner gets the parameters, its actor applies the approve / reject, `continue` writes the output as before, a runner failure and a plain error take the same paths as phase 5), the unknown type with no runner, guard parity through the neutral handler (a cancel or restart during the run writes nothing, a forged task never reaches a runner), the registry, and `AutomationStepRunner` directly (texts, log context, bypass, outcomes). The phase 5 tests are the proof that automation did not change.

**Files:**
- Create: `packages/api-workflows/src/features/stepRun/StepRunner/abstractions.ts`
- Create: `packages/api-workflows/src/features/stepRun/StepRunner/index.ts`
- Create: `packages/api-workflows/src/features/stepRun/StepRunnerRegistryService/abstractions.ts`
- Create: `packages/api-workflows/src/features/stepRun/StepRunnerRegistryService/StepRunnerRegistryService.ts`
- Create: `packages/api-workflows/src/features/stepRun/StepRunnerRegistryService/feature.ts`
- Create: `packages/api-workflows/src/features/stepRun/StepRunnerRegistryService/index.ts`
- Create: `packages/api-workflows/src/features/stepRun/AutomationStepRunner/AutomationStepRunner.ts`
- Create: `packages/api-workflows/src/features/stepRun/AutomationStepRunner/feature.ts`
- Modify: `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskHandler.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/TestStepRunner.ts`
- Create: `packages/api-workflows/__tests__/stepRun/StepRunnerRegistryService.test.ts`
- Create: `packages/api-workflows/__tests__/stepRun/AutomationStepRunner.test.ts`
- Create: `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskDispatch.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts` (two assertions)

**Interfaces:**
- Consumes:
  - Existing (phase 5, verified with CodeGraph): `WorkflowStepRunTaskHandler` (`TaskHandler.createImplementation`, constructor `(repository, saver, logger, definitions, approveStep, rejectStep, bypass, identityContext)`), `StepRunFailure` (`~/features/stepRun/StepRunFailure.js`, `reason`), `getStaleStepRunReason(review: ReviewData, stepId: string, task: StepRunTaskIdentity): string | null` and `StepRunTaskIdentity { id: string; createdById: string }` (`~/domain/review/getStaleStepRunReason.js`), `AutomationDefinitionRegistryService.get(id)` (`~/features/automation/AutomationDefinitionRegistryService/index.js`), `AutomationDefinition` (`Interface`, `Outcome`, `RunParams`), `automationStepConfigSchema`, `getAutomationActor(requester: Actor): Actor`, `parseAutomationSettings(definition, settings): Result<unknown, string>` (`~/domain/automation/*.js`), `WorkflowBypassService` (`run<T>(callback)`, `isActive()`), `REJECT_COMMENT_MIN_LENGTH` (`~/domain/review/Review.js`), `AUTOMATION_STEP_TYPE` (`~/domain/workflow/stepTypes.js`), `DEFAULT_AUTOMATION_MAX_ITERATIONS` (`~/features/stepRun/constants.js`), `Actor`, `ReviewData`, `ReviewStep` (`~/domain/review/types.js`).
  - Test helpers (phase 5): `createContextHandler`, `createFakeTaskController` (`FakeTaskControllerParams`: `iterations`, `createdById`, `output`, `outputUpdateError`; result `{ controller, task, outputUpdates }`), `captureLoggedErrors` / `loggedErrors` / `loggedInfos`, `RecordingEventPublisher` / `recordedEvents` / `workflowEventTypes`, `FailingReviewSave` / `reviewSaveFaults`, `resetFakeTasks`, `registerTestAutomation` / `TestAutomationDefinition` / `TEST_AUTOMATION_ID`, `AUTOMATION_STEP_ID` / `automationActor` / `createRunningAutomationReview` (`stepRunReviews.js`), `createAutomationStep` (`TestAutomationDefinition.js`), `ARTICLE_MODEL`, `createWorkflow`, `expectOk`, `NOW`, `requester`, `targetContext`, `toSaveData` (`fixtures.js`), `Review.request` / `Review.reachRun` (the fake review is built from a one-step workflow, not from `createPendingAutomationReview`).
  - Task 1 and 2 (6.1) are not consumed here.
- Produces (matches the contract):
  - `StepRunner` (`~/features/stepRun/StepRunner/index.js`; namespace `Interface`, `Outcome`, `Params`, `FailureReasons`), exactly the contract signatures; `issues` on the decision outcome is typed `unknown[]` until Task 5 narrows it to `AiIssue[]`.
  - `StepRunnerRegistryService` (`~/features/stepRun/StepRunnerRegistryService/index.js`): `get(type: string): StepRunner.Interface | null`, `list(): StepRunner.Interface[]`.
  - `AutomationStepRunner` (registered as `StepRunner` by `WorkflowsFeature`).
  - `WorkflowStepRunTaskHandler` with constructor `(repository, saver, logger, definitions, runners, approveStep, rejectStep, identityContext)`; the hooks and `createInputValidation` unchanged. Consumed by Tasks 4, 6, 19.
  - Test helper `TestStepRunner` (`~tests/__helpers/TestStepRunner.js`): a configurable fake runner for Tasks 3 and 4 (and for any later task that needs a `StepRunner` fake).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/TestStepRunner.ts`. The fake runner records every `run` call; its `runImpl` is replaceable per test; `getActor` returns the actor that `createFakeStepReview` stores as the step owner (the approve and reject use cases require the actor to be the step's owner, `Review.approve`), so a test that sees the approve succeed has proven the handler used `runner.getActor(requester)`:

```ts
import type { Container } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import type { Actor, ReviewData, ReviewStep } from "~/domain/review/types.js";
import { StepRunner } from "~/features/stepRun/StepRunner/index.js";
import { AUTOMATION_STEP_ID } from "./stepRunReviews.js";
import { createAutomationStep } from "./TestAutomationDefinition.js";
import {
    ARTICLE_MODEL,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    targetContext,
    toSaveData
} from "./fixtures.js";

export const FAKE_STEP_TYPE = "fake-runner";

/** The owner of a fake step: the requester's id and name with type `ai`. */
export const fakeActor: Actor = {
    type: "ai",
    id: requester.id,
    displayName: requester.displayName
};

export interface TestStepRunnerOptions {
    type?: string;
    singleRun?: boolean;
    failureReasons?: Partial<StepRunner.FailureReasons>;
    maxIterations?: number;
}

/**
 * A `StepRunner` for tests. Every `run` call is recorded in `runCalls`; replace `runImpl` to
 * change what it answers or does (default: approve with the comment `Looks good.`). Register it
 * with `registerTestStepRunner` in a `setup` callback of `createContextHandler`.
 */
export class TestStepRunner implements StepRunner.Interface {
    public readonly type: string;
    public readonly singleRun: boolean;
    public readonly failureReasons: StepRunner.FailureReasons;
    public readonly runCalls: StepRunner.Params[] = [];
    public runImpl: (params: StepRunner.Params) => Promise<StepRunner.Outcome> = async () => {
        return { type: "approved", comment: "Looks good." };
    };
    private readonly maxIterations: number;

    public constructor(options: TestStepRunnerOptions = {}) {
        this.type = options.type ?? FAKE_STEP_TYPE;
        this.singleRun = options.singleRun ?? false;
        this.maxIterations = options.maxIterations ?? 3;
        this.failureReasons = {
            error: "The fake step failed.",
            aborted: "The fake step was aborted.",
            stuck: "The fake step ended without a result.",
            ...options.failureReasons
        };
    }

    public maxIterationsReason(step: ReviewStep): string {
        return `The fake step "${step.id}" did not finish in ${this.maxIterations} iterations.`;
    }

    public getActor(): Actor {
        return fakeActor;
    }

    public async run(params: StepRunner.Params): Promise<StepRunner.Outcome> {
        this.runCalls.push(params);
        return this.runImpl(params);
    }
}

export const registerTestStepRunner = (container: Container, runner: TestStepRunner): void => {
    container.registerInstance(StepRunner, runner as StepRunner.Interface);
};

/**
 * Review "review-1" built from a ONE-step workflow (the step "automation"), so approving the step
 * finishes the review: it is `approved` and the review does not move on to a second step. The
 * step is reached with `taskId`, `inReview`, owned by `fakeActor`, with its type replaced by
 * `type`. Save it with `ReviewRepository.save`. (Do not build it on `createPendingAutomationReview`:
 * that one has a second review step "editorial", which an approve would reach.)
 */
export const createFakeStepReview = (
    taskId: string | null = "task-1",
    type: string = FAKE_STEP_TYPE
): ReviewData => {
    const workflow = createWorkflow({
        steps: [createAutomationStep({ id: AUTOMATION_STEP_ID, title: "Check links" })]
    });
    const review = expectOk(
        Review.request({
            id: "review-1",
            workflow,
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
    expectOk(review.reachRun({ actor: requester, owner: fakeActor, taskId, now: NOW }));
    const data = toSaveData(review);
    data.steps[0].type = type;
    data.steps[0].config = {};
    data.currentStepType = type;
    return data;
};
```

Create `packages/api-workflows/__tests__/stepRun/StepRunnerRegistryService.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { TestStepRunner, registerTestStepRunner } from "~tests/__helpers/TestStepRunner.js";
import { AUTOMATION_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { StepRunnerRegistryService } from "~/features/stepRun/StepRunnerRegistryService/index.js";

const setup = async (register: (container: Container) => void = () => undefined) => {
    const { context } = await createContextHandler({ setup: register });
    return context.container.resolve(StepRunnerRegistryService);
};

describe("StepRunnerRegistryService (R168)", () => {
    it("has the automation runner registered by WorkflowsFeature", async () => {
        const registry = await setup();

        const runner = registry.get(AUTOMATION_STEP_TYPE);

        expect(runner).not.toBeNull();
        expect(runner).toMatchObject({
            type: "automation",
            singleRun: false,
            failureReasons: {
                error: "The automation failed.",
                aborted: "The automation was aborted.",
                stuck: "The automation task ended without a result."
            }
        });
        expect(registry.list().map(item => item.type)).toEqual(["automation"]);
    });

    it("returns null for a type nothing is registered for", async () => {
        const registry = await setup();

        expect(registry.get("ai")).toBeNull();
        expect(registry.get("")).toBeNull();
    });

    it("lists the registered runners in registration order", async () => {
        const registry = await setup(container => {
            registerTestStepRunner(container, new TestStepRunner({ type: "fake-a" }));
            registerTestStepRunner(container, new TestStepRunner({ type: "fake-b" }));
        });

        expect(registry.list().map(item => item.type)).toEqual(["automation", "fake-a", "fake-b"]);
        expect(registry.get("fake-b")?.type).toBe("fake-b");
    });

    it("keeps the last registration per type, in the place of the first", async () => {
        const first = new TestStepRunner({ type: "fake-a", failureReasons: { error: "First." } });
        const second = new TestStepRunner({ type: "fake-a", failureReasons: { error: "Second." } });
        const registry = await setup(container => {
            registerTestStepRunner(container, first);
            registerTestStepRunner(container, new TestStepRunner({ type: "fake-b" }));
            registerTestStepRunner(container, second);
        });

        expect(registry.list().map(item => item.type)).toEqual(["automation", "fake-a", "fake-b"]);
        expect(registry.get("fake-a")).toBe(second);
    });

    it("lets a later registration replace the automation runner", async () => {
        const replacement = new TestStepRunner({ type: AUTOMATION_STEP_TYPE });
        const registry = await setup(container => registerTestStepRunner(container, replacement));

        expect(registry.get(AUTOMATION_STEP_TYPE)).toBe(replacement);
        expect(registry.list()).toHaveLength(1);
    });
});
```

Create `packages/api-workflows/__tests__/stepRun/AutomationStepRunner.test.ts`. It resolves the runner from the registry and calls `run` directly with hand-built parameters:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    registerTestAutomation,
    TEST_AUTOMATION_ID,
    type TestAutomationDefinition
} from "~tests/__helpers/TestAutomationDefinition.js";
import {
    AUTOMATION_STEP_ID,
    automationActor,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
import { requester, toSaveData } from "~tests/__helpers/fixtures.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { StepRunFailure } from "~/features/stepRun/StepRunFailure.js";
import { StepRunner } from "~/features/stepRun/StepRunner/index.js";
import { StepRunnerRegistryService } from "~/features/stepRun/StepRunnerRegistryService/index.js";
import type { ReviewStep } from "~/domain/review/types.js";

interface SetupParams {
    maxIterations?: number;
    none?: boolean;
}

const setup = async (params: SetupParams = {}) => {
    let registered: TestAutomationDefinition | null = null;
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            if (!params.none) {
                registered = registerTestAutomation(container, {
                    maxIterations: params.maxIterations
                });
            }
        }
    });
    const runner = context.container.resolve(StepRunnerRegistryService).get("automation");
    if (!runner) {
        throw new Error("The automation runner is not registered.");
    }
    const bypass = context.container.resolve(WorkflowBypassService);

    /** Run parameters for the one automation step, with the stored config replaced by `config`. */
    const buildParams = (
        config: Record<string, unknown>,
        overrides: Partial<StepRunner.Params> = {}
    ): StepRunner.Params => {
        const review = toSaveData(createRunningAutomationReview("task-1"));
        review.steps[0].config = config;
        return {
            review,
            step: review.steps[0],
            requester,
            task: { id: "task-1", createdById: requester.id },
            iteration: 1,
            state: null,
            signal: new AbortController().signal,
            ...overrides
        };
    };

    return { runner, bypass, definition: registered as TestAutomationDefinition | null, buildParams };
};

const configFor = (settings: Record<string, unknown>) => {
    return { automationId: TEST_AUTOMATION_ID, settings };
};

const expectFailure = async (promise: Promise<unknown>, reason: string | RegExp) => {
    const error = await promise.then(
        () => null,
        thrown => thrown
    );
    expect(error).toBeInstanceOf(StepRunFailure);
    if (typeof reason === "string") {
        expect((error as StepRunFailure).reason).toBe(reason);
    } else {
        expect((error as StepRunFailure).reason).toMatch(reason);
    }
};

describe("AutomationStepRunner (R168)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("declares the automation texts, the actor and that it never runs single", async () => {
        const { runner } = await setup();

        expect(runner.type).toBe("automation");
        expect(runner.singleRun).toBe(false);
        expect(runner.failureReasons).toEqual({
            error: "The automation failed.",
            aborted: "The automation was aborted.",
            stuck: "The automation task ended without a result."
        });
        expect(runner.getActor(requester)).toEqual(automationActor);
    });

    describe("maxIterationsReason (R145, P4)", () => {
        const stepWith = (config: Record<string, unknown>): ReviewStep => {
            const review = toSaveData(createRunningAutomationReview("task-1"));
            return { ...review.steps[0], config };
        };

        it("names the default of 50 when the definition sets no limit", async () => {
            const { runner } = await setup();

            expect(runner.maxIterationsReason(stepWith(configFor({})))).toBe(
                "The automation did not finish in 50 iterations."
            );
        });

        it("names the definition's own limit", async () => {
            const { runner } = await setup({ maxIterations: 7 });

            expect(runner.maxIterationsReason(stepWith(configFor({})))).toBe(
                "The automation did not finish in 7 iterations."
            );
        });

        it("falls back to the default for an unknown definition or a config that does not parse", async () => {
            const { runner } = await setup({ maxIterations: 7 });

            expect(
                runner.maxIterationsReason(stepWith({ automationId: "other", settings: {} }))
            ).toBe("The automation did not finish in 50 iterations.");
            expect(runner.maxIterationsReason(stepWith({ settings: {} }))).toBe(
                "The automation did not finish in 50 iterations."
            );
        });
    });

    describe("run", () => {
        it("approves with the comment and hands the definition the parsed settings and the run state", async () => {
            const { runner, definition, buildParams } = await setup();
            const params = buildParams(configFor({ comment: "Links are fine." }), {
                iteration: 2,
                state: { page: 1 }
            });

            const outcome = await runner.run(params);

            expect(outcome).toEqual({ type: "approved", comment: "Links are fine." });
            expect(definition!.runCalls).toHaveLength(1);
            expect(definition!.runCalls[0]).toMatchObject({
                settings: { mode: "approve", comment: "Links are fine." },
                iteration: 2,
                state: { page: 1 }
            });
            expect(definition!.runCalls[0].review).toBe(params.review);
            expect(definition!.runCalls[0].step).toBe(params.step);
        });

        it("rejects with the trimmed comment", async () => {
            const { runner, buildParams } = await setup();

            const outcome = await runner.run(
                buildParams(configFor({ mode: "reject", comment: "  The links are broken.  " }))
            );

            expect(outcome).toEqual({ type: "rejected", comment: "The links are broken." });
        });

        it.each([
            { name: "no comment", settings: { mode: "reject" } },
            { name: "a comment shorter than 10 characters", settings: { mode: "reject", comment: "No." } }
        ])("fails when it rejects with $name (D100)", async ({ settings }) => {
            const { runner, buildParams } = await setup();

            await expectFailure(
                runner.run(buildParams(configFor(settings))),
                "The automation rejected without a comment."
            );
        });

        it("returns a continue outcome as the definition gave it", async () => {
            const { runner, buildParams } = await setup();

            const outcome = await runner.run(buildParams(configFor({ mode: "wait" }), { iteration: 3 }));

            expect(outcome).toEqual({ type: "continue", wait: 1, state: { iterations: 3 } });
        });

        it("fails with the unknown outcome text", async () => {
            const { runner, definition, buildParams } = await setup();
            definition!.run = async () => ({ type: "nonsense" }) as never;

            await expectFailure(
                runner.run(buildParams(configFor({}))),
                "The automation failed: It returned an unknown outcome."
            );
        });

        it("fails with a fixed reason when the definition throws, and logs the raw error with the identifiers", async () => {
            const { runner, bypass, buildParams } = await setup();

            await expectFailure(
                runner.run(buildParams(configFor({ mode: "throw" }))),
                "The automation failed."
            );

            expect(bypass.isActive()).toBe(false);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe("The automation threw.");
            expect(loggedErrors[0].fields).toEqual({
                error: expect.objectContaining({ message: "The test automation threw." }),
                taskId: "task-1",
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID
            });
        });

        it("fails when the config does not parse, without running the definition", async () => {
            const { runner, definition, buildParams } = await setup();

            await expectFailure(
                runner.run(buildParams({ settings: {} })),
                "The automation step configuration is not valid."
            );
            expect(definition!.runCalls).toEqual([]);
        });

        it("fails when the definition is not registered", async () => {
            const { runner, buildParams } = await setup({ none: true });

            await expectFailure(
                runner.run(buildParams(configFor({}))),
                'The automation "test-automation" is not available.'
            );
        });

        it("fails when the settings are not valid, without running the definition", async () => {
            const { runner, definition, buildParams } = await setup();

            await expectFailure(
                runner.run(buildParams(configFor({ mode: "nonsense" }))),
                /^The automation settings are not valid: mode: /
            );
            expect(definition!.runCalls).toEqual([]);
        });

        it("fails past the definition's own limit and past the default of 50", async () => {
            const limited = await setup({ maxIterations: 2 });
            await limited.runner.run(limited.buildParams(configFor({}), { iteration: 2 }));
            await expectFailure(
                limited.runner.run(limited.buildParams(configFor({}), { iteration: 3 })),
                "The automation did not finish in 2 iterations."
            );

            const unlimited = await setup();
            await expectFailure(
                unlimited.runner.run(unlimited.buildParams(configFor({}), { iteration: 51 })),
                "The automation did not finish in 50 iterations."
            );
            expect(unlimited.definition!.runCalls).toEqual([]);
        });

        it("runs the definition inside the bypass and only there (D36, R150)", async () => {
            const { runner, bypass, definition, buildParams } = await setup();
            const active: boolean[] = [];
            const original = definition!.run.bind(definition);
            definition!.run = async params => {
                active.push(bypass.isActive());
                return original(params);
            };

            await runner.run(buildParams(configFor({})));

            expect(active).toEqual([true]);
            expect(bypass.isActive()).toBe(false);
        });

        it("ignores the signal, which only a runner that needs it reads (R175)", async () => {
            const { runner, definition, buildParams } = await setup();
            const aborted = new AbortController();
            aborted.abort();

            const outcome = await runner.run(
                buildParams(configFor({ comment: "Links are fine." }), {
                    signal: aborted.signal
                })
            );

            expect(outcome).toEqual({ type: "approved", comment: "Links are fine." });
            expect(definition!.runCalls).toHaveLength(1);
        });
    });
});
```

Create `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskDispatch.test.ts`. It drives the handler with the fake runner (R157: the container builds the handler with `resolveImplementation`, `createFakeTaskController` stands in for the task runner):

```ts
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

describe("workflowsStepRun dispatches by the step type (R168)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
        loggedInfos.length = 0;
        recordedEvents.length = 0;
        reviewSaveFaults.failNext = false;
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

            await expect(result).resolves.toEqual({ status: "continue", input: INPUT, wait: undefined });
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
            { name: "a comment shorter than 10 characters", outcome: { type: "rejected", comment: "No." } }
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
                error: { message: "The runner crashed." }
            });
            expect(await read()).toEqual(before);
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

    describe("never trusts its input (SEC-68, R148)", () => {
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
```

Modify `packages/api-workflows/__tests__/registration.test.ts` (R168, D18): add the two imports next to the `StuckStepService` import

```ts
import { StepRunner } from "~/features/stepRun/StepRunner/index.js";
import { StepRunnerRegistryService } from "~/features/stepRun/StepRunnerRegistryService/index.js";
```

and the two assertions right after `expect(container.resolveAll(StuckStepService)).toHaveLength(1);` in the test `registers every workflows abstraction once (D18)`:

```ts
        expect(container.resolveAll(StepRunnerRegistryService)).toHaveLength(1);
        // The built-in automation runner; later sub-phases register their own next to it (R168).
        expect(container.resolveAll(StepRunner)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/stepRun/StepRunnerRegistryService.test.ts packages/api-workflows/__tests__/stepRun/AutomationStepRunner.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskDispatch.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. All four files fail to load: `Cannot find module '~/features/stepRun/StepRunner/index.js'` (the helper `TestStepRunner.ts` imports it, the registry and runner tests import the registry and the abstraction, `registration.test.ts` imports both).

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepRun/StepRunnerRegistryService.test.ts packages/api-workflows/__tests__/stepRun/AutomationStepRunner.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskDispatch.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: The abstraction, the registry, the automation runner and the handler**

Create `packages/api-workflows/src/features/stepRun/StepRunner/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { StepRunTaskIdentity } from "~/domain/review/getStaleStepRunReason.js";
import type { Actor, ReviewData, ReviewStep } from "~/domain/review/types.js";

/**
 * `approved` and `rejected` end the step; a `rejected` outcome needs a comment of 10 or more
 * characters after trimming (D100). `issues` is typed `unknown[]` until the review step carries
 * `AiIssue` (Task 5 narrows it).
 */
export interface StepRunnerDecisionOutcome {
    type: "approved" | "rejected";
    comment?: string;
    issues?: unknown[];
}

/** Run the step again: `wait` seconds later, with `state` handed back on the next call. */
export interface StepRunnerContinueOutcome {
    type: "continue";
    wait?: number;
    state?: Record<string, unknown>;
}

export type StepRunnerOutcome = StepRunnerDecisionOutcome | StepRunnerContinueOutcome;

/** Fixed texts stored as the step's reason when the step fails (R146); never a raw error. */
export interface StepRunnerFailureReasons {
    /** The run threw, or its outcome could not be applied. */
    error: string;
    /** The task was aborted. */
    aborted: string;
    /** The task ended without writing a result (stuck detection, R152). */
    stuck: string;
}

export interface StepRunnerRunParams {
    /** The review as stored when the run started; read-only for the runner. */
    review: ReviewData;
    /** The step being run, from the review snapshot (A53). */
    step: ReviewStep;
    /** The review's requester: the identity everything runs as (R161). */
    requester: Actor;
    /** The task's own identity, the one the stale guard compares (R144). */
    task: StepRunTaskIdentity;
    /** The runner's own run count: 1 on the first call, +1 for every `continue`; waits for the task id are not counted (R163). */
    iteration: number;
    /** The `state` of the previous `continue` outcome; `null` on the first call. */
    state: Record<string, unknown> | null;
    /** Fires when the task's remaining runtime is nearly used up (R175). */
    signal: AbortSignal;
}

export interface IStepRunner {
    /** The step type this runner runs (`step.type`). */
    readonly type: string;
    /**
     * True when the runner never returns `continue`: the handler persists `{ idWaits, state }`
     * before calling it and refuses a re-entered task (R170). False for automation.
     */
    readonly singleRun: boolean;
    readonly failureReasons: StepRunnerFailureReasons;
    /** The fixed reason when the task hit its iteration ceiling (R145). */
    maxIterationsReason(step: ReviewStep): string;
    /** The actor that owns the step and applies its outcome (R141, R164). */
    getActor(requester: Actor): Actor;
    /** Throws `StepRunFailure` for a failure with a fixed reason (R146). */
    run(params: StepRunnerRunParams): Promise<StepRunnerOutcome>;
}

/**
 * Runs one step type inside the private `workflowsStepRun` task (R168). Multi-registered; the
 * registry returns the last registration per `type`. The handler owns what is shared (read, stale
 * guard, id wait, identity, applying the outcome, the one failure path); a runner owns what is
 * specific to its step type.
 */
export const StepRunner = createAbstraction<IStepRunner>("StepRunner");

export namespace StepRunner {
    export type Interface = IStepRunner;
    export type Outcome = StepRunnerOutcome;
    export type Params = StepRunnerRunParams;
    export type FailureReasons = StepRunnerFailureReasons;
}
```

Create `packages/api-workflows/src/features/stepRun/StepRunner/index.ts`:

```ts
export { StepRunner } from "./abstractions.js";
export type {
    IStepRunner,
    StepRunnerContinueOutcome,
    StepRunnerDecisionOutcome,
    StepRunnerFailureReasons,
    StepRunnerOutcome,
    StepRunnerRunParams
} from "./abstractions.js";
```

Create `packages/api-workflows/src/features/stepRun/StepRunnerRegistryService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { StepRunner } from "~/features/stepRun/StepRunner/abstractions.js";

export interface IStepRunnerRegistryService {
    /** The runner for this step type; `null` when none is registered. */
    get(type: string): StepRunner.Interface | null;
    /** Registration order; the last registration per `type` wins and keeps the first one's place. */
    list(): StepRunner.Interface[];
}

/** The registered step runners (R168). */
export const StepRunnerRegistryService = createAbstraction<IStepRunnerRegistryService>(
    "StepRunnerRegistryService"
);

export namespace StepRunnerRegistryService {
    export type Interface = IStepRunnerRegistryService;
}
```

Create `packages/api-workflows/src/features/stepRun/StepRunnerRegistryService/StepRunnerRegistryService.ts`:

```ts
import { StepRunner } from "~/features/stepRun/StepRunner/abstractions.js";
import { StepRunnerRegistryService as Abstraction } from "./abstractions.js";

class StepRunnerRegistryServiceImpl implements Abstraction.Interface {
    private readonly runners = new Map<string, StepRunner.Interface>();

    public constructor(runners: StepRunner.Interface[]) {
        for (const runner of runners) {
            this.runners.set(runner.type, runner);
        }
    }

    public get(type: string): StepRunner.Interface | null {
        return this.runners.get(type) ?? null;
    }

    public list(): StepRunner.Interface[] {
        return [...this.runners.values()];
    }
}

export const StepRunnerRegistryService = Abstraction.createImplementation({
    implementation: StepRunnerRegistryServiceImpl,
    dependencies: [[StepRunner, { multiple: true }]]
});
```

Create `packages/api-workflows/src/features/stepRun/StepRunnerRegistryService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StepRunnerRegistryService } from "./StepRunnerRegistryService.js";

export const StepRunnerRegistryFeature = createFeature({
    name: "Workflows/StepRunnerRegistry",
    register(container) {
        container.register(StepRunnerRegistryService);
    }
});
```

Create `packages/api-workflows/src/features/stepRun/StepRunnerRegistryService/index.ts`:

```ts
export { StepRunnerRegistryService } from "./abstractions.js";
```

Create `packages/api-workflows/src/features/stepRun/AutomationStepRunner/AutomationStepRunner.ts`. The look-up, the checks and the texts are the phase 5 handler code (steps 3 and 4) moved as they were, plus the outcome checks the handler did, with the same texts:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { REJECT_COMMENT_MIN_LENGTH } from "~/domain/review/Review.js";
import type { Actor, ReviewStep } from "~/domain/review/types.js";
import { AUTOMATION_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import type { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { DEFAULT_AUTOMATION_MAX_ITERATIONS } from "~/features/stepRun/constants.js";
import { StepRunFailure } from "~/features/stepRun/StepRunFailure.js";
import { StepRunner } from "~/features/stepRun/StepRunner/abstractions.js";

/**
 * Runs an automation step (spec 7.4, R142): the logic the phase 5 handler held, moved here
 * unchanged (R168). Looks up and validates everything from the review snapshot (A53, R148),
 * then runs the developer's definition inside the bypass and only there (D36, R150). It ignores
 * `signal` (R175) and is never `singleRun`: an automation may continue (R135).
 */
class AutomationStepRunnerImpl implements StepRunner.Interface {
    public readonly type = AUTOMATION_STEP_TYPE;
    public readonly singleRun = false;
    public readonly failureReasons: StepRunner.FailureReasons = {
        error: "The automation failed.",
        aborted: "The automation was aborted.",
        stuck: "The automation task ended without a result."
    };

    public constructor(
        private definitions: AutomationDefinitionRegistryService.Interface,
        private bypass: WorkflowBypassService.Interface,
        private logger: Logger.Interface
    ) {}

    public maxIterationsReason(step: ReviewStep): string {
        // The reason names the automation's own limit from the review snapshot, never the
        // 10000 ceiling of the task definition (R145, P4).
        const config = automationStepConfigSchema.safeParse(step.config);
        const own = config.success ? this.definitions.get(config.data.automationId) : null;
        const maxIterations = own?.maxIterations ?? DEFAULT_AUTOMATION_MAX_ITERATIONS;
        return `The automation did not finish in ${maxIterations} iterations.`;
    }

    public getActor(requester: Actor): Actor {
        return getAutomationActor(requester);
    }

    public async run({
        review,
        step,
        task,
        iteration,
        state
    }: StepRunner.Params): Promise<StepRunner.Outcome> {
        const config = automationStepConfigSchema.safeParse(step.config);
        if (!config.success) {
            throw new StepRunFailure("The automation step configuration is not valid.");
        }
        const automationId = config.data.automationId;
        const definition = this.definitions.get(automationId);
        if (!definition) {
            throw new StepRunFailure(`The automation "${automationId}" is not available.`);
        }
        const maxIterations = definition.maxIterations ?? DEFAULT_AUTOMATION_MAX_ITERATIONS;
        if (iteration > maxIterations) {
            throw new StepRunFailure(`The automation did not finish in ${maxIterations} iterations.`);
        }
        const settings = parseAutomationSettings(definition, config.data.settings);
        if (settings.isFail()) {
            throw new StepRunFailure(`The automation settings are not valid: ${settings.error}.`);
        }

        // Run inside the bypass, and only there (D36, R150).
        let outcome: AutomationDefinition.Outcome;
        try {
            outcome = await this.bypass.run(() =>
                definition.run({
                    settings: settings.value,
                    review,
                    step,
                    iteration,
                    state
                })
            );
        } catch (error) {
            // The raw message can carry internals: logged, never stored (R146).
            this.logger.error(
                { error, taskId: task.id, reviewId: review.id, stepId: step.id },
                "The automation threw."
            );
            throw new StepRunFailure("The automation failed.");
        }

        switch (outcome.type) {
            case "approved":
                return { type: "approved", comment: outcome.comment };
            case "rejected": {
                const comment = (outcome.comment ?? "").trim();
                if (comment.length < REJECT_COMMENT_MIN_LENGTH) {
                    throw new StepRunFailure("The automation rejected without a comment.");
                }
                return { type: "rejected", comment };
            }
            case "continue":
                return outcome;
            default:
                throw new StepRunFailure("The automation failed: It returned an unknown outcome.");
        }
    }
}

export const AutomationStepRunner = StepRunner.createImplementation({
    implementation: AutomationStepRunnerImpl,
    dependencies: [AutomationDefinitionRegistryService, WorkflowBypassService, Logger]
});
```

Create `packages/api-workflows/src/features/stepRun/AutomationStepRunner/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { AutomationStepRunner } from "./AutomationStepRunner.js";

export const AutomationStepRunnerFeature = createFeature({
    name: "Workflows/AutomationStepRunner",
    register(container) {
        container.register(AutomationStepRunner);
    }
});
```

Modify `packages/api-workflows/src/WorkflowsFeature.ts`: add the imports next to the existing `WorkflowStepRunTaskFeature` import

```ts
import { StepRunnerRegistryFeature } from "~/features/stepRun/StepRunnerRegistryService/feature.js";
import { AutomationStepRunnerFeature } from "~/features/stepRun/AutomationStepRunner/feature.js";
```

and register them right before the task feature:

```ts
        // Step run tasks (R142-R145): the abort service shared by the saver, the reach and cancel
        ReviewTaskAbortServiceFeature.register(container);
        // The step runners the task dispatches to, and the built-in automation runner (R168)
        StepRunnerRegistryFeature.register(container);
        AutomationStepRunnerFeature.register(container);
        // The private task that runs a workflow step (R142)
        WorkflowStepRunTaskFeature.register(container);
```

Modify `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskHandler.ts`. The import block becomes (removed: `getAutomationActor`, `parseAutomationSettings`, `AutomationDefinition`, `WorkflowBypassService`; added: `StepRunnerRegistryService`; `automationStepConfigSchema` and `AutomationDefinitionRegistryService` stay for the hooks until Task 4):

```ts
import "@webiny/background-tasks/api/features/TaskController/augmentation.js";
import {
    TaskHandler,
    type TaskDefinition
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import { getRequesterIdentity } from "~/domain/automation/getRequesterIdentity.js";
import { Review, REJECT_COMMENT_MIN_LENGTH } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewTargetSyncError } from "~/domain/review/errors.js";
import { getStaleStepRunReason } from "~/domain/review/getStaleStepRunReason.js";
import type { ReviewStep } from "~/domain/review/types.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import {
    DEFAULT_AUTOMATION_MAX_ITERATIONS,
    STEP_RUN_TASKID_WAIT_SECONDS,
    STEP_RUN_TASKID_WAIT_TRIES
} from "../constants.js";
import { StepRunFailure } from "../StepRunFailure.js";
import { StepRunnerRegistryService } from "../StepRunnerRegistryService/index.js";
import type { StepRunTaskInput } from "../types.js";
```

The class comment and the constructor become (`definitions` stays for the hooks, `runners` is new, `bypass` is gone):

```ts
/**
 * Runs one step of any type (spec 7.4, R142, R168). `run` reads the review, applies the stale
 * guard (a forged, foreign or restarted task writes nothing, R144, R148), waits a few iterations
 * for its task id to appear on the step (R143), hands the step to the `StepRunner` registered for
 * its type, which runs as the requester (R150, R161), and applies the runner's outcome through
 * the base approve and reject use cases as the runner's actor (R141). Every failure fails the
 * step once, with a fixed reason (R146). The failure hooks fail the step when the runner reports
 * an error, the iteration ceiling or an abort. Every write is guarded; a hook never throws.
 */
class WorkflowStepRunTaskHandlerImpl implements TaskHandler.Interface<StepRunTaskInput> {
    public constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface,
        private logger: Logger.Interface,
        private definitions: AutomationDefinitionRegistryService.Interface,
        private runners: StepRunnerRegistryService.Interface,
        private approveStep: ApproveReviewStepUseCase.Interface,
        private rejectStep: RejectReviewStepUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}
```

In `run`, steps 1 and 2 (read, guard, wait for the task id), the `step` lookup and the `requester` / `identity` lines stay as they are. Everything from `return this.identityContext.withIdentity(identity, async () => {` to the end of `run` becomes:

```ts
        return this.identityContext.withIdentity(identity, async () => {
            try {
                // 3. Pick the runner from the review snapshot (A53, R148, R168).
                const runner = this.runners.get(step.type);
                if (!runner) {
                    throw new StepRunFailure(`The step type "${step.type}" is not available.`);
                }
                // `iteration` counts runs, never the waits for the task id (R163).
                const output = controller.state.getOutput();
                const idWaits =
                    typeof output?.idWaits === "number" ? output.idWaits : task.iterations - 1;
                const iteration = task.iterations - idWaits;
                const state = (output?.state ?? null) as Record<string, unknown> | null;

                // 4. Run the step. The runner validates its own config and owns its own
                // dependencies and texts; a failure is a thrown `StepRunFailure` (R146).
                // `signal` is a placeholder until Task 4 builds the real one.
                const outcome = await runner.run({
                    review: data,
                    step,
                    requester,
                    task: { id: task.id, createdById: task.createdBy.id },
                    iteration,
                    state,
                    signal: new AbortController().signal
                });

                // The runner may have run for a while: the review can have been cancelled, or
                // the step aborted and restarted under another task. A stale task writes nothing.
                const after = await this.repository.get(reviewId);
                if (after.isFail()) {
                    this.logger.error(
                        { error: after.error, taskId: task.id, reviewId, stepId },
                        "Could not read the review to apply the automation outcome."
                    );
                    return controller.response.error(after.error);
                }
                const staleAfter = getStaleStepRunReason(after.value, stepId, {
                    id: task.id,
                    createdById: task.createdBy.id
                });
                if (staleAfter) {
                    this.logger.info(
                        { taskId: task.id, reviewId, stepId, stale: staleAfter },
                        "Ignored a stale step run outcome."
                    );
                    return controller.response.done();
                }

                // 5. Apply the outcome as the runner's actor (R135, R141, R168).
                switch (outcome.type) {
                    case "approved": {
                        const approved = await this.approveStep.execute({
                            reviewId,
                            stepId,
                            actor: runner.getActor(requester),
                            actorTeamIds: [],
                            comment: outcome.comment
                        });
                        if (approved.isFail()) {
                            this.logger.error(
                                { error: approved.error, taskId: task.id, reviewId, stepId },
                                "Applying the automation outcome failed."
                            );
                            throw new StepRunFailure(runner.failureReasons.error);
                        }
                        return controller.response.done();
                    }
                    case "rejected": {
                        const comment = (outcome.comment ?? "").trim();
                        if (comment.length < REJECT_COMMENT_MIN_LENGTH) {
                            throw new StepRunFailure(runner.failureReasons.error);
                        }
                        const rejected = await this.rejectStep.execute({
                            reviewId,
                            stepId,
                            actor: runner.getActor(requester),
                            actorTeamIds: [],
                            comment
                        });
                        if (rejected.isFail()) {
                            this.logger.error(
                                { error: rejected.error, taskId: task.id, reviewId, stepId },
                                "Applying the automation outcome failed."
                            );
                            throw new StepRunFailure(runner.failureReasons.error);
                        }
                        return controller.response.done();
                    }
                    case "continue": {
                        // One whole write of what this handler keeps in the task output (R135,
                        // R163): the wait count and the runner's state.
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
                        throw new StepRunFailure(runner.failureReasons.error);
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
                        {
                            taskId: task.id,
                            reviewId,
                            stepId,
                            stale: staleNow,
                            reason: error.reason
                        },
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

`createInputValidation`, `onError`, `onMaxIterations` and `onAbort` stay unchanged. The last statement of the file becomes:

```ts
export const WorkflowStepRunTaskHandler = TaskHandler.createImplementation({
    implementation: WorkflowStepRunTaskHandlerImpl,
    dependencies: [
        ReviewRepository,
        ReviewSaver,
        Logger,
        AutomationDefinitionRegistryService,
        StepRunnerRegistryService,
        ApproveReviewStepUseCase,
        RejectReviewStepUseCase,
        IdentityContext
    ]
});
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/stepRun/StepRunnerRegistryService.test.ts packages/api-workflows/__tests__/stepRun/AutomationStepRunner.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskDispatch.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepRun/StepRunnerRegistryService.test.ts packages/api-workflows/__tests__/stepRun/AutomationStepRunner.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskDispatch.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors.

- [ ] **Step 5: Run the existing tests covering the changed code (unchanged, no expectation may change)**

The refactor moves phase 5 code: every phase 5 test of the handler, its hooks, stuck detection, the reach and the registries must stay green without an edit (Review Focus 5):

Run: `yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts packages/api-workflows/__tests__/stepTypes/AutomationStepType.test.ts packages/api-workflows/__tests__/automation/AutomationDefinitionRegistryService.test.ts packages/api-workflows/__tests__/bypass/WorkflowBypassService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS (`registration.test.ts` carries only this task's two new assertions), with `git diff --stat -- packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts` printing nothing.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts packages/api-workflows/__tests__/stepTypes/AutomationStepType.test.ts packages/api-workflows/__tests__/automation/AutomationDefinitionRegistryService.test.ts packages/api-workflows/__tests__/bypass/WorkflowBypassService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
git commit -m "refactor(api-workflows): dispatch the step run handler through a StepRunner registry" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```
