### Task 16: CMS restart wrapper and GraphQL

Spec 5.1, 10; D8, D34, D82, D132, D133; R33, R46, R87, R107 (does not apply), R153, R158. One wrapper and one mutation in `packages/api-headless-cms-workflows`, mirroring the reviewed phase 4 `ReassignCmsEntryReviewStepUseCase` (it takes `stepId`, same guard, same engine call shape) with the permission body of `CancelCmsEntryReviewUseCase`:

- `RestartCmsEntryReviewStepUseCase.execute({ reviewId, stepId })`: `CmsEntryReviewGuardService.authorize({ reviewId, action: "restart a review step" })`. The guard already does everything the phase 4 wrappers rely on: `viewer.get()` inside a try/catch (a throwing team or permission load is `Workflows/Review/Persistence`, R87), `NotAuthenticated` for an anonymous identity, `GetReviewUseCase`, a non-`cms.*` review is `Workflows/Review/NotFound` (R46), and read access to the target (unreadable is `Workflows/NotAuthorized`, a throwing read or access check is `Workflows/Review/Persistence`, R87). Do not duplicate any of it in the wrapper.
- Then `canRestartByPermission(review, viewer)` (Task 6; requester or `reassign`). Refusal: `WorkflowsNotAuthorizedError({ action: "restart a review step" })`. Permission only: whether the step can be restarted (`failed` and current) is the engine's (1b R41); a `rejected` or `approved` step comes back as `Workflows/Review/InvalidState` with `transition: "restart"`, a step that is not current as `Workflows/Review/StepNotCurrent`.
- Then the engine's `RestartReviewStepUseCase` (Task 15) with `{ reviewId, stepId, actor: viewer.actor }`. The engine re-reaches the step as the requester, never as the restarter (R149); the wrapper passes only the actor.
- GraphQL: `CmsMutation.restartCmsEntryReviewStep(reviewId: ID!, stepId: ID!): CmsEntryReviewResponse!` (R158), a resolver that calls only the wrapper (D132) and maps a failed result with `ErrorResponse`. No revision id argument, so R107 does not apply. `CmsEntryReviewResponse` is the existing envelope around `WorkflowsReview`, like every other transition; `taskId` and `runs` are already on its steps (Task 4), so the mutation adds no step fields. `canRestart` is on `WorkflowsViewerFlags` (Task 6) and is read through `getCmsEntryReview`.

Every refusal before the engine is pinned with `engineCalls` (`CountingEngineCalls` gains `RestartReviewStep`). Failed steps are produced by a new seed helper that writes the review straight through the `ReviewRepository`, as `seedFailedStep` does; the restart re-reaches an automation step, so the tests register a CMS-local copy of the R157 seams (`TestAutomationDefinition`, `registerTestAutomation(container, overrides?)`, `FakeTaskService` from Task 9, `FakeGetTask`; the api-workflows test helpers are not importable from this package, so the names and signatures repeat, P1).

**`ReviewTargetSyncError` (final review of 5.3).** The engine restart returns `ReviewTargetSyncError` (`Workflows/Review/TargetSync`) when the review was saved (restarted, new `taskId`, new task kept running) but writing the target failed (R16). Handle it exactly as the existing wrappers do: no special case. `ReassignCmsEntryReviewStepUseCase` and `CancelCmsEntryReviewUseCase` (`packages/api-headless-cms-workflows/src/features/wrappers/`) return the engine's failed `Result` unchanged, and the resolvers in `packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts` map any failed result with `new ErrorResponse(result.error)`. Do not catch it, convert it, abort the task or add a retry; the new restart wrapper and resolver follow the same shape, and the wrapper test only needs to show the error passes through unchanged (engine-side behaviour is pinned in api-workflows `RestartReviewStep.test.ts`).

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/RestartCmsEntryReviewStep/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/RestartCmsEntryReviewStep/RestartCmsEntryReviewStepUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/RestartCmsEntryReviewStep/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/RestartCmsEntryReviewStep/index.ts`
- Modify: `packages/api-headless-cms-workflows/package.json` (devDependency `"zod": "4.4.3"`, the version `api-workflows` declares; only the test automation imports it)
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__helpers/CountingEngineCalls.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__helpers/seeds.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/TestAutomationDefinition.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/FakeGetTask.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/registration.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/wrappers/restartReviewStep.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/graphql/cmsRestartSchema.test.ts`

**Interfaces:**
- Consumes:
  - Task 15: `RestartReviewStepUseCase` (`@webiny/api-workflows/features/review/RestartReviewStep/index.js`), `Input { reviewId; stepId; actor }`, errors `ReviewNotFoundError | ReviewPersistenceError | ReviewInvalidStateError | ReviewStepNotCurrentError | ReviewTargetSyncError`.
  - Task 6: `canRestartByPermission(review: ReviewData, viewer: ReviewPermissionViewer): boolean` (`@webiny/api-workflows/domain/review/canRestartByPermission.js`).
  - Task 4: `taskId`, `runs` on `ReviewStep` and on the shared `WorkflowsReviewStep` GraphQL type.
  - Task 5: `getAutomationActor` (`@webiny/api-workflows/domain/automation/getAutomationActor.js`, used by the seed helper).
  - Task 2 / R157: the `AutomationDefinition` abstraction (`@webiny/api-workflows/features/automation/AutomationDefinition/index.js`); `TaskService` (`@webiny/api-core/features/task/TaskService/index.js`).
  - Phase 2-4: `CmsEntryReviewGuardService` (`Error`, `authorize({ reviewId, action })` returning `{ review, viewer }`), `ErrorResponse`, `Response`, the test helpers `asUser`-style contexts (`createUserContext`), `createWbReview`, `throwOnWorkflowsPermissions`, `throwOnAccessChecks`, `folderLevels`, `countEngineCalls`.
- Produces:
  - `RestartCmsEntryReviewStepUseCase` with `Input { reviewId: string; stepId: string }`, `Return = Promise<Result<ReviewData, UseCaseError>>`, `UseCaseError = CmsEntryReviewGuardService.Error | WorkflowsNotAuthorizedError | RestartReviewStepUseCase.Error`; exported with `RestartCmsEntryReviewStepInput` from `index.ts`.
  - GraphQL `CmsMutation.restartCmsEntryReviewStep`.
  - Test helpers: `seedFailedAutomationStep` (`seeds.ts`), `TestAutomationDefinition` (with `runCalls`), `registerTestAutomation(container, overrides?)`, `FakeGetTask` and `registerFakeGetTask` (`FakeGetTask.ts`; the `@webiny/background-tasks` devDependency comes from Task 14), and the Task 9 `FakeTaskService` calls (`triggeredTasks`, `abortedTasks`, `resetFakeTasks()`), the `RestartReviewStep` engine-call name. Consumed by the review of this task only; Task 17 writes its own copies in the WB package.

- [ ] **Step 1: Write the failing tests**

Test seams. Create `packages/api-headless-cms-workflows/__tests__/__helpers/TestAutomationDefinition.ts`:

```ts
import { z } from "zod";
import type { Container } from "@webiny/di";
import { AutomationDefinition } from "@webiny/api-workflows/features/automation/AutomationDefinition/index.js";

/** The only automation the tests register; its id is what the seeded failed step points at. */
export const TEST_AUTOMATION_ID = "test-automation";

export const testAutomationSettingsSchema = z.object({
    mode: z.enum(["approve", "reject", "wait", "throw"]).default("approve"),
    comment: z.string().optional()
});

export type TestAutomationSettings = z.infer<typeof testAutomationSettingsSchema>;

export interface TestAutomationOverrides {
    id?: string;
    name?: string;
    models?: string[];
    maxIterations?: number;
}

/**
 * Package-local copy of the api-workflows test helper (R157, P1: same names and signatures; the
 * api-workflows helpers are not importable here). Restart tests never run the task (no runner
 * here; the handler is Task 12's), so `run` only records the call and approves.
 */
export class TestAutomationDefinition implements AutomationDefinition.Interface<TestAutomationSettings> {
    public readonly id: string;
    public readonly name: string;
    public readonly models: string[];
    public readonly maxIterations?: number;
    public readonly settingsSchema = testAutomationSettingsSchema;
    public readonly runCalls: AutomationDefinition.RunParams<TestAutomationSettings>[] = [];

    public constructor(overrides: TestAutomationOverrides = {}) {
        this.id = overrides.id ?? TEST_AUTOMATION_ID;
        this.name = overrides.name ?? "Test automation";
        this.models = overrides.models ?? ["*"];
        this.maxIterations = overrides.maxIterations;
    }

    public async run(
        params: AutomationDefinition.RunParams<TestAutomationSettings>
    ): Promise<AutomationDefinition.Outcome> {
        this.runCalls.push(params);
        return { type: "approved" };
    }
}

/**
 * Registers the test automation and returns the instance. The one signature of every task and
 * package: `registerTestAutomation(container, overrides?)`. Also usable as a `legacyPlugins`
 * entry (the test handler calls function plugins with the container only).
 */
export const registerTestAutomation = (
    container: Container,
    overrides: TestAutomationOverrides = {}
): TestAutomationDefinition => {
    const definition = new TestAutomationDefinition(overrides);
    container.registerInstance(AutomationDefinition, definition as AutomationDefinition.Interface);
    return definition;
};
```

`FakeTaskService` already exists in this package (Task 9 created the package-local copy and registers it in the test context by default; it exports `triggeredTasks`, `abortedTasks`, `fakeTaskFaults`, `resetFakeTasks()`, R157). Task 14 gave the context a `NoopGetTask`. Restart needs a task read that finds the tasks the fake service "triggered", so create `packages/api-headless-cms-workflows/__tests__/__helpers/FakeGetTask.ts`:

```ts
import type { Container } from "@webiny/di";
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { triggeredTasks } from "./FakeTaskService.js";

/**
 * Package-local `FakeGetTask` (R157, P1; Task 14 wrote the api-workflows one). Single review reads
 * run stuck detection (R152), which reads the step's task: after a restart the step is `inReview`
 * with a task the fake task service "triggered", so the read must find it running, as the
 * requester (the stale guard compares `createdBy`). The context's `NoopGetTask` returns `null`,
 * which stuck detection would treat as a lost task and fail the step.
 */
export class FakeGetTask implements GetTaskUseCase.Interface {
    public async execute<I extends TaskService.TaskInput, O extends TaskService.GenericOutput>(
        id: string
    ): Promise<TaskService.Task<I, O> | null> {
        const triggered = triggeredTasks.find(task => task.id === id);
        if (!triggered) {
            return null;
        }
        return {
            id,
            name: triggered.name ?? "",
            definitionId: triggered.definition,
            executionName: "",
            input: {},
            iterations: 1,
            taskStatus: TaskDataStatus.RUNNING,
            eventResponse: undefined,
            createdOn: "2026-10-13T10:00:00.000Z",
            savedOn: "2026-10-13T10:00:00.000Z",
            createdBy: { id: triggered.identityId, displayName: "", type: triggered.identityType }
        } as never;
    }
}

/** Replaces the context's `NoopGetTask` (`legacyPlugins`: function plugins run last, last wins). */
export const registerFakeGetTask = (container: Container) => {
    container.registerInstance(GetTaskUseCase, new FakeGetTask());
};
```

In `packages/api-headless-cms-workflows/__tests__/__helpers/CountingEngineCalls.ts` add the import `import { RestartReviewStepUseCase } from "@webiny/api-workflows/features/review/RestartReviewStep/index.js";`, a class next to `CountingReassignReviewStep`:

```ts
class CountingRestartReviewStep implements RestartReviewStepUseCase.Interface {
    public constructor(private decoratee: RestartReviewStepUseCase.Interface) {}

    public async execute(input: RestartReviewStepUseCase.Input): RestartReviewStepUseCase.Return {
        engineCalls.push("RestartReviewStep");
        return this.decoratee.execute(input);
    }
}
```

and, after the `ReassignReviewStepUseCase` decorator registration in `countEngineCalls`:

```ts
    container.registerDecorator(
        RestartReviewStepUseCase.createDecorator({
            decorator: CountingRestartReviewStep,
            dependencies: []
        })
    );
```

In `packages/api-headless-cms-workflows/__tests__/__helpers/seeds.ts` fix the stale comment of `seedFailedStep` ("nothing produces `failed` before phase 5, R93" becomes "the tests seed `failed` straight through the repository") and add, with the imports `getAutomationActor` (`@webiny/api-workflows/domain/automation/getAutomationActor.js`), `toActor` (from `./identities.js`) and `TEST_AUTOMATION_ID`:

```ts
export const FAILED_REASON = "The automation failed.";

/**
 * Stores the review with its only step failed as an automation step that ran once as `task-old`,
 * straight through the repository: what a failed run leaves behind (R140, R146). Restarting it
 * re-reaches the registered test automation as the requester.
 */
export const seedFailedAutomationStep = async (
    context: CmsContext,
    review: ReviewData,
    reason: string = FAILED_REASON
): Promise<ReviewData> => {
    const owner = getAutomationActor(review.createdBy);
    const failed: ReviewData = {
        ...review,
        currentStepState: "failed",
        currentStepType: "automation",
        currentOwnerId: owner.id,
        steps: review.steps.map((step): ReviewStep => {
            return {
                ...step,
                type: "automation",
                config: { automationId: TEST_AUTOMATION_ID, settings: { mode: "approve" } },
                state: "failed",
                owner,
                comment: reason,
                taskId: "task-old",
                reachedOn: "2026-10-13T10:00:00.000Z",
                startedOn: "2026-10-13T10:00:00.000Z",
                finishedOn: "2026-10-13T10:01:00.000Z"
            };
        })
    };
    return expectOk(await context.container.resolve(ReviewRepository).save(failed));
};
```

(`toActor` is not needed if `review.createdBy` is already an `Actor`; drop the import then.)

In `packages/api-headless-cms-workflows/__tests__/registration.test.ts` add `import { RestartCmsEntryReviewStepUseCase } from "~/features/wrappers/RestartCmsEntryReviewStep/index.js";` and `RestartCmsEntryReviewStepUseCase,` to `WRAPPERS` after `ReassignCmsEntryReviewStepUseCase`.

In `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts` add `"restartCmsEntryReviewStep"` to `CMS_MUTATION_FIELDS` after `"reassignCmsEntryReviewStep"`.

Create `packages/api-headless-cms-workflows/__tests__/wrappers/restartReviewStep.test.ts`. The scenario mirrors `routingWrappers.test.ts` (`createScenario`, `asUser`), with the pool step failed through `seedFailedAutomationStep`; REQUESTER is the requester, REASSIGNER holds `reassign`, REVIEWER holds neither:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { FAILED_REASON, seedFailedAutomationStep } from "~tests/__helpers/seeds.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { REASSIGNER, REQUESTER, REVIEWER } from "~tests/__helpers/identities.js";
import { CMS_READER, CMS_WRITER, WORKFLOWS_REASSIGN } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { throwingTargetRevisions, scriptTargetReads } from "~tests/__helpers/ScriptedTargetReads.js";
import { throwingAccessChecks, throwOnAccessChecks } from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import { resetFakeTasks, triggeredTasks } from "~tests/__helpers/FakeTaskService.js";
import { registerFakeGetTask } from "~tests/__helpers/FakeGetTask.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import { RestartCmsEntryReviewStepUseCase } from "~/features/wrappers/RestartCmsEntryReviewStep/index.js";

const REQUESTER_PERMISSIONS = CMS_WRITER;
const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...CMS_READER];
const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: CMS_WRITER,
    [REVIEWER.id]: CMS_READER
};

/**
 * Admin stores the workflow and REQUESTER asks for reviews of "Ann" (root) and "Locked"
 * ("folder-locked"); the only step of each is then a failed automation run.
 */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const lockedEntry = await createAuthorEntry(admin, {
        name: "Locked",
        folderId: "folder-locked"
    });
    const review = await seedFailedAutomationStep(admin, await requestEntryReview(admin, entry));
    const lockedReview = await seedFailedAutomationStep(
        admin,
        await requestEntryReview(admin, lockedEntry)
    );
    return { admin, review, lockedReview };
};

const asUser = (
    identity: IdentityData | null,
    permissions: SecurityPermission[],
    legacyPlugins: unknown[] = []
): Promise<CmsContext> => {
    return createUserContext({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [
            ...createExtraModelPlugins(),
            registerTestUsers,
            registerTestAutomation,
            registerFakeGetTask,
            countEngineCalls,
            scriptTargetReads,
            throwOnAccessChecks,
            ...legacyPlugins
        ]
    });
};

const restart = (context: CmsContext, reviewId: string, stepId: string = STEP_ID) => {
    return context.container.resolve(RestartCmsEntryReviewStepUseCase).execute({ reviewId, stepId });
};

describe("CMS restart wrapper", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        resetFakeTasks();
    });

    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
        throwingTargetRevisions.clear();
    });

    it("restarts a failed step for the requester and re-reaches it as the requester (R153)", async () => {
        const { review } = await createScenario();
        const requester = await asUser(REQUESTER, REQUESTER_PERMISSIONS);

        const restarted = expectOk(await restart(requester, review.id));

        expect(restarted.currentStepState).toBe("inReview");
        expect(restarted.steps[0].taskId).toBe("task-1");
        expect(restarted.steps[0].runs).toEqual([
            expect.objectContaining({
                taskId: "task-old",
                outcome: "failed",
                reason: FAILED_REASON
            })
        ]);
        expect(triggeredTasks.map(task => task.identityId)).toEqual([REQUESTER.id]);
        expect(engineCalls).toContain("RestartReviewStep");
    });

    it("lets a viewer with reassign restart, and the task still runs as the requester (D82)", async () => {
        const { review } = await createScenario();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const restarted = expectOk(await restart(reassigner, review.id));

        expect(restarted.currentStepState).toBe("inReview");
        expect(triggeredTasks.map(task => task.identityId)).toEqual([REQUESTER.id]);
    });

    it("refuses a viewer who is neither the requester nor a reassigner, before the engine (R153)", async () => {
        const { review } = await createScenario();
        const reviewer = await asUser(REVIEWER, CMS_READER);

        const result = await restart(reviewer, review.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "restart a review step" });
        expect(engineCalls).not.toContain("RestartReviewStep");
        expect(triggeredTasks).toEqual([]);
    });

    it("refuses a requester without read access to the target, before the engine", async () => {
        const { lockedReview } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REQUESTER.id, "no-access"]]));
        const requester = await asUser(REQUESTER, REQUESTER_PERMISSIONS);

        const result = await restart(requester, lockedReview.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "restart a review step" });
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("passes the engine's state errors through unchanged and triggers nothing", async () => {
        const { admin, review } = await createScenario();
        const requester = await asUser(REQUESTER, REQUESTER_PERMISSIONS);
        const rejected = await asRejected(admin, review);

        const wrongStep = await restart(requester, review.id, "step-missing");
        const wrongState = await restart(requester, rejected.id);

        expect(wrongStep.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(wrongState.error.code).toBe("Workflows/Review/InvalidState");
        expect(wrongState.error.data).toMatchObject({ transition: "restart" });
        expect(engineCalls.filter(call => call === "RestartReviewStep")).toHaveLength(2);
        expect(triggeredTasks).toEqual([]);
    });

    it("fails with a persistence error when the viewer's permissions fail to load (R87)", async () => {
        const { review } = await createScenario();
        const requester = await asUser(REQUESTER, REQUESTER_PERMISSIONS, [
            throwOnWorkflowsPermissions
        ]);

        const result = await restart(requester, review.id);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("reports a Website Builder review as not found (R46)", async () => {
        const wbReview = await createWbReview();
        const requester = await asUser(REQUESTER, REQUESTER_PERMISSIONS);

        const result = await restart(requester, wbReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("refuses an anonymous identity and fails with a persistence error when the read check throws (R87)", async () => {
        const { review } = await createScenario();
        const anonymous = await asUser(null, []);
        const requester = await asUser(REQUESTER, REQUESTER_PERMISSIONS);

        const refused = await restart(anonymous, review.id);
        throwingAccessChecks.add("canRead");
        engineCalls.length = 0;
        const failed = await restart(requester, review.id);

        expect(refused.error.code).toBe("Workflows/NotAuthenticated");
        expect(failed.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual(["GetReview"]);
    });
});
```

`asRejected(admin, review)` is a local helper in the same file: it stores a copy of the seeded review with the step `rejected` (`ReviewRepository.save({ ...review, currentStepState: "rejected", steps: review.steps.map(step => ({ ...step, state: "rejected" })) })`, `expectOk`), the state the engine refuses to restart (R140). Add the `ReviewRepository` import (`@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js`) with it.

Create `packages/api-headless-cms-workflows/__tests__/graphql/cmsRestartSchema.test.ts` with the same scenario shape as `cmsRoutingSchema.test.ts` (`clientFor`, `run`, `createScenario`, seeding the step with `seedFailedAutomationStep`; `clientFor` adds `registerTestAutomation, registerFakeGetTask` to its `legacyPlugins`; `resetFakeTasks`, `engineCalls` and `folderLevels` are imported like in the wrapper test):

```ts
const STEP_FIELDS = "id state comment taskId runs { taskId outcome reason }";

const RESTART_STEP = /* GraphQL */ `
    mutation RestartStep($reviewId: ID!, $stepId: ID!) {
        cms {
            restartCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId) {
                data { id currentStepState steps { ${STEP_FIELDS} } }
                error { code message data }
            }
        }
    }
`;

const GET_REVIEW_FLAGS = /* GraphQL */ `
    query GetReviewFlags($id: ID!) {
        cms {
            getCmsEntryReview(id: $id) {
                data { review { id currentStepState } flags { canRestart } }
                error { code message data }
            }
        }
    }
`;
```

Tests (inside `describe("CMS restart GraphQL")`, `beforeEach` clears `engineCalls` and calls `resetFakeTasks()`; `afterEach` clears `folderLevels`):

```ts
it("restarts a failed step and returns the new run data (R158)", async () => {
    const { review } = await createScenario();
    const requester = clientFor(REQUESTER, CMS_WRITER);

    const before = await run(requester, GET_REVIEW_FLAGS, { id: review.id });
    const restarted = await run(requester, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });
    const after = await run(requester, GET_REVIEW_FLAGS, { id: review.id });

    expect(before.getCmsEntryReview.data.flags.canRestart).toBe(true);
    expect(restarted.restartCmsEntryReviewStep.error).toBeNull();
    expect(restarted.restartCmsEntryReviewStep.data).toMatchObject({
        id: review.id,
        currentStepState: "inReview"
    });
    expect(restarted.restartCmsEntryReviewStep.data.steps[0]).toMatchObject({
        taskId: "task-1",
        runs: [{ taskId: "task-old", outcome: "failed", reason: FAILED_REASON }]
    });
    expect(after.getCmsEntryReview.data.flags.canRestart).toBe(false);
});

it("returns the refusal with code and data for a viewer without reassign (R125)", async () => {
    const { review } = await createScenario();
    const reviewer = clientFor(REVIEWER, CMS_READER);

    const refused = await run(reviewer, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });
    const flags = await run(reviewer, GET_REVIEW_FLAGS, { id: review.id });

    expect(refused.restartCmsEntryReviewStep).toEqual({
        data: null,
        error: {
            code: "Workflows/NotAuthorized",
            message: "You are not allowed to restart a review step.",
            data: { action: "restart a review step" }
        }
    });
    expect(flags.getCmsEntryReview.data.flags.canRestart).toBe(false);
    expect(engineCalls).not.toContain("RestartReviewStep");
});

it("returns the engine's invalid-state error for a step that is not failed", async () => {
    const { review } = await createScenario();
    const requester = clientFor(REQUESTER, CMS_WRITER);
    await run(requester, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });

    const again = await run(requester, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });

    expect(again.restartCmsEntryReviewStep.data).toBeNull();
    expect(again.restartCmsEntryReviewStep.error).toMatchObject({
        code: "Workflows/Review/InvalidState",
        data: { transition: "restart" }
    });
});

it("reports a Website Builder review as not found and leaves it unchanged (R46)", async () => {
    const wbReview = await createWbReview();
    const requester = clientFor(REQUESTER, CMS_WRITER);

    const result = await run(requester, RESTART_STEP, { reviewId: wbReview.id, stepId: STEP_ID });

    expect(result.restartCmsEntryReviewStep.data).toBeNull();
    expect(result.restartCmsEntryReviewStep.error).toMatchObject({
        code: "Workflows/Review/NotFound",
        data: { id: wbReview.id }
    });
    expect(engineCalls).not.toContain("RestartReviewStep");
});

it("refuses an anonymous identity", async () => {
    const { review } = await createScenario();
    const anonymous = clientFor(null, []);

    const result = await run(anonymous, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });

    expect(result.restartCmsEntryReviewStep.error.code).toBe("Workflows/NotAuthenticated");
});
```

(The license gate is pinned by the `cmsWorkflowsSchemaLicense.test.ts` edit above.)

- [ ] **Step 2: Run the tests and see them fail**

```bash
yarn test packages/api-headless-cms-workflows/__tests__/wrappers/restartReviewStep.test.ts 2>&1 | tail -30
yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsRestartSchema.test.ts 2>&1 | tail -30
```

Expected: FAIL, the use case module does not exist.

- [ ] **Step 3: Implement the wrapper**

`packages/api-headless-cms-workflows/src/features/wrappers/RestartCmsEntryReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { RestartReviewStepUseCase } from "@webiny/api-workflows/features/review/RestartReviewStep/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface RestartCmsEntryReviewStepInput {
    reviewId: string;
    stepId: string;
}

export interface IRestartCmsEntryReviewStepUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    restart: RestartReviewStepUseCase.Error;
}

type UseCaseError =
    IRestartCmsEntryReviewStepUseCaseErrors[keyof IRestartCmsEntryReviewStepUseCaseErrors];

export interface IRestartCmsEntryReviewStepUseCase {
    execute(input: RestartCmsEntryReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Run a failed CMS review step again (spec 5.1, D8, D34, D82, R153): read access to the target
 * and the requester or `reassign` here, the step's state in the engine.
 */
export const RestartCmsEntryReviewStepUseCase =
    createAbstraction<IRestartCmsEntryReviewStepUseCase>("RestartCmsEntryReviewStepUseCase");

export namespace RestartCmsEntryReviewStepUseCase {
    export type Interface = IRestartCmsEntryReviewStepUseCase;
    export type Input = RestartCmsEntryReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

`RestartCmsEntryReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { RestartReviewStepUseCase } from "@webiny/api-workflows/features/review/RestartReviewStep/index.js";
import { canRestartByPermission } from "@webiny/api-workflows/domain/review/canRestartByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { RestartCmsEntryReviewStepUseCase as UseCase } from "./abstractions.js";

const ACTION = "restart a review step";

class RestartCmsEntryReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
        private restartStep: RestartReviewStepUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: ACTION
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { review, viewer } = authorized.value;
        // Permission only: whether the step can be restarted is the engine's (1b R41).
        if (!canRestartByPermission(review, viewer)) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: ACTION }));
        }

        return this.restartStep.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            actor: viewer.actor
        });
    }
}

export const RestartCmsEntryReviewStepUseCase = UseCase.createImplementation({
    implementation: RestartCmsEntryReviewStepUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, RestartReviewStepUseCase]
});
```

`feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RestartCmsEntryReviewStepUseCase } from "./RestartCmsEntryReviewStepUseCase.js";

export const RestartCmsEntryReviewStepFeature = createFeature({
    name: "CmsWorkflows/RestartCmsEntryReviewStep",
    register(container) {
        container.register(RestartCmsEntryReviewStepUseCase);
    }
});
```

`index.ts`:

```ts
export { RestartCmsEntryReviewStepUseCase } from "./abstractions.js";
export type { RestartCmsEntryReviewStepInput } from "./abstractions.js";
```

In `src/features/wrappers/feature.ts` import `RestartCmsEntryReviewStepFeature` from `./RestartCmsEntryReviewStep/feature.js` and call `RestartCmsEntryReviewStepFeature.register(container);` after `ReassignCmsEntryReviewStepFeature.register(container);` (the "Reviews" group).

- [ ] **Step 4: Add the GraphQL mutation**

In `src/graphql/CmsWorkflowsSchemaFactory.ts`: import `RestartCmsEntryReviewStepUseCase` from `~/features/wrappers/RestartCmsEntryReviewStep/index.js`; in the `CmsMutation` type defs add after `reassignCmsEntryReviewStep(...)`:

```graphql
        restartCmsEntryReviewStep(reviewId: ID!, stepId: ID!): CmsEntryReviewResponse!
```

and after the `reassignCmsEntryReviewStep` resolver add:

```ts
        builder.addResolver<RestartCmsEntryReviewStepUseCase.Input>({
            path: "CmsMutation.restartCmsEntryReviewStep",
            dependencies: [RestartCmsEntryReviewStepUseCase],
            resolver: (restartStep: RestartCmsEntryReviewStepUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await restartStep.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });
```

- [ ] **Step 5: Run the tests and see them pass**

```bash
yarn test packages/api-headless-cms-workflows/__tests__/wrappers/restartReviewStep.test.ts 2>&1 | tail -50
yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsRestartSchema.test.ts 2>&1 | tail -50
yarn test:os packages/api-headless-cms-workflows/__tests__/wrappers/restartReviewStep.test.ts 2>&1 | tail -50
yarn test:os packages/api-headless-cms-workflows/__tests__/graphql/cmsRestartSchema.test.ts 2>&1 | tail -50
```

Run the `:os` commands one at a time (parallel runs clash on port 8001). Then the registration test, the license test and one earlier file per touched helper (`CountingEngineCalls`, `graphql.ts`), each by path with `yarn test:os`: `__tests__/registration.test.ts`, the license test named above, `__tests__/wrappers/reviewTransitions.test.ts`.

Expected: PASS on both storages.

- [ ] **Step 6: Typecheck and commit**

```bash
yarn tsc -p packages/api-headless-cms-workflows/tsconfig.build.json --noEmit 2>&1 | tail -10
```

Then the Before Commit chain from `CLAUDE.md` (`yarn` for the lockfile, `format:fix`, `lint:fix`, `adio`, ts-configs check). `zod` is a devDependency only (tests); `adio` must stay clean. Commit:

```
feat(api-headless-cms-workflows): add the restart review step wrapper and graphql mutation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
