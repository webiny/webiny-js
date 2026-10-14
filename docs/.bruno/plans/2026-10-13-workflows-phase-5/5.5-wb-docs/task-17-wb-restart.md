### Task 17: WB restart wrapper and GraphQL

Spec 5.1, 10; D8, D34, D82, D132, D133; R33, R46, R87, R107 (does not apply), R153, R158. One wrapper and one mutation in `packages/api-website-builder-workflows`, mirroring Task 16 and the reviewed phase 4 `ReassignWebsiteBuilderPageReviewStepUseCase` (it takes `stepId`, same guard, same engine call shape) with the permission body of `CancelWebsiteBuilderPageReviewUseCase`:

- `RestartWebsiteBuilderPageReviewStepUseCase.execute({ reviewId, stepId })`: `WbPageReviewGuardService.authorize({ reviewId, action: "restart a review step" })`. The guard already does everything the phase 4 wrappers rely on: `viewer.get()` inside a try/catch (a throwing team or permission load is `Workflows/Review/Persistence`, R87), `NotAuthenticated` for an anonymous identity, `GetReviewUseCase`, a non-`wb.page` review is `Workflows/Review/NotFound` (R46), and read access to the page (unreadable is `Workflows/NotAuthorized`, a throwing read or access check is `Workflows/Review/Persistence`, R87). Do not duplicate any of it in the wrapper.
- Then `canRestartByPermission(review, viewer)` (Task 6; requester or `reassign`). Refusal: `WorkflowsNotAuthorizedError({ action: "restart a review step" })`. Permission only: whether the step can be restarted is the engine's (1b R41): a `rejected` or `approved` step is `Workflows/Review/InvalidState` with `transition: "restart"`, a step that is not current is `Workflows/Review/StepNotCurrent`.
- Then the engine's `RestartReviewStepUseCase` (Task 15) with `{ reviewId, stepId, actor: viewer.actor }`; the re-reach runs as the requester, never the restarter (R149).
- GraphQL: `WbMutation.restartWebsiteBuilderPageReviewStep(reviewId: ID!, stepId: ID!): WbPageReviewResponse!` (R158; the WB envelope is `WbPageReviewResponse`), a resolver that calls only the wrapper (D132) and maps a failed result with `ErrorResponse`. No revision id argument, so R107 does not apply. The envelope wraps `WorkflowsReview` like every other transition; `taskId` and `runs` already come from the shared step type (Task 4), so no step fields are added. `canRestart` is on `WorkflowsViewerFlags` and is read through `getWebsiteBuilderPageReview`.

Every refusal before the engine is pinned with `engineCalls` (`CountingEngineCalls` gains `RestartReviewStep`). The WB package gets its own copies of Task 16's test seams and a new `seeds.ts`; the failed step is written straight through the `ReviewRepository`.

**`ReviewTargetSyncError` (final review of 5.3).** The engine restart returns `ReviewTargetSyncError` (`Workflows/Review/TargetSync`) when the review was saved (restarted, new `taskId`, new task kept running) but writing the target failed (R16). Handle it exactly as the existing wrappers do: no special case. `ReassignWebsiteBuilderPageReviewStepUseCase` and `CancelWebsiteBuilderPageReviewUseCase` (`packages/api-website-builder-workflows/src/features/wrappers/`) return the engine's failed `Result` unchanged, and the resolvers in `packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts` map any failed result with `new ErrorResponse(result.error)`. Do not catch it, convert it, abort the task or add a retry; the new restart wrapper and resolver follow the same shape, and the wrapper test only needs to show the error passes through unchanged (engine-side behaviour is pinned in api-workflows `RestartReviewStep.test.ts`).

**Files:**
- Create: `packages/api-website-builder-workflows/src/features/wrappers/RestartWebsiteBuilderPageReviewStep/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/RestartWebsiteBuilderPageReviewStep/RestartWebsiteBuilderPageReviewStepUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/RestartWebsiteBuilderPageReviewStep/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/RestartWebsiteBuilderPageReviewStep/index.ts`
- Modify: `packages/api-website-builder-workflows/package.json` (devDependency `"zod": "4.4.3"`, the version `api-workflows` declares; only the test automation imports it)
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/CountingEngineCalls.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/seeds.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/TestAutomationDefinition.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/FakeTaskService.ts` (unless Task 9 already added the copy)
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/FakeGetTask.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/registration.test.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/graphql/license.test.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/graphql.ts`
- Create: `packages/api-website-builder-workflows/__tests__/wrappers/restartReviewStep.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/graphql/pageRestart.test.ts`

**Interfaces:**
- Consumes:
  - Task 15: `RestartReviewStepUseCase` (`@webiny/api-workflows/features/review/RestartReviewStep/index.js`), `Input { reviewId; stepId; actor }`, errors `ReviewNotFoundError | ReviewPersistenceError | ReviewInvalidStateError | ReviewStepNotCurrentError | ReviewTargetSyncError`.
  - Task 6: `canRestartByPermission(review: ReviewData, viewer: ReviewPermissionViewer): boolean` (`@webiny/api-workflows/domain/review/canRestartByPermission.js`).
  - Task 4: `taskId`, `runs` on `ReviewStep` and on the shared `WorkflowsReviewStep` GraphQL type.
  - Task 5: `getAutomationActor` (`@webiny/api-workflows/domain/automation/getAutomationActor.js`, used by the seed helper).
  - Task 2 / R157: the `AutomationDefinition` abstraction (`@webiny/api-workflows/features/automation/AutomationDefinition/index.js`); `TaskService` (`@webiny/api-core/features/task/TaskService/index.js`).
  - Phase 2-4: `WbPageReviewGuardService` (`Error`, `authorize({ reviewId, action })` returning `{ review, viewer }`), `ErrorResponse`, `Response`, the test helpers `createUserContext`, `createCmsReview`, `throwOnWorkflowsPermissions`, `throwOnAccessChecks`, `folderLevels`, `countEngineCalls`, `storeWbWorkflow`, `requestPageReview`; Task 16 (the shape this task mirrors).
- Produces:
  - `RestartWebsiteBuilderPageReviewStepUseCase` with `Input { reviewId: string; stepId: string }`, `Return = Promise<Result<ReviewData, UseCaseError>>`, `UseCaseError = WbPageReviewGuardService.Error | WorkflowsNotAuthorizedError | RestartReviewStepUseCase.Error`; exported with `RestartWebsiteBuilderPageReviewStepInput` from `index.ts`.
  - GraphQL `WbMutation.restartWebsiteBuilderPageReviewStep`.
  - Test helpers: `seedFailedAutomationStep` (`seeds.ts`), `TestAutomationDefinition` (with `runCalls`), `registerTestAutomation(container, overrides?)`, `FakeGetTask`, `registerFakeGetTask`, `registerFakeTaskService` and its recorded calls (`triggeredTasks`, `abortedTasks`, `resetFakeTasks()`), the `RestartReviewStep` engine-call name. Consumed by this task's tests only.

- [ ] **Step 1: Write the failing tests**

Test seams. The WB package has its own copies of the R157 seams (the api-workflows and CMS test helpers are not importable). Create `packages/api-website-builder-workflows/__tests__/__helpers/TestAutomationDefinition.ts` exactly as Task 16 Step 1 shows it (`TEST_AUTOMATION_ID`, `testAutomationSettingsSchema`, `TestAutomationDefinition` with `runCalls`, `registerTestAutomation(container, overrides?)`; P1), `FakeTaskService.ts` as the api-workflows helper of Task 9 (the same code repeated on purpose; exports `FakeTaskService`, `triggeredTasks`, `abortedTasks`, `fakeTaskFaults`, `resetFakeTasks`; if Task 9 already added this copy because `TaskService` did not resolve, it exists: reuse it) and `FakeGetTask.ts` as Task 16 shows it (same code, `registerFakeGetTask`). Unlike the CMS context, the WB test context registers the real `BackgroundTasksFeature`, so the tests register both fakes: `registerFakeTaskService` (add to `FakeTaskService.ts`: `export const registerFakeTaskService = (container: Container) => { container.register(FakeTaskService); };`, `Container` from `@webiny/di`) so a restart triggers nothing real, and `registerFakeGetTask`, because a restarted step is `inReview` with a fake task id that the real task storage does not know and the single review read (stuck detection, R152) would fail the step as lost. The `@webiny/background-tasks` dependency is already declared in this package.

In `packages/api-website-builder-workflows/__tests__/__helpers/CountingEngineCalls.ts` add the `CountingRestartReviewStep` class and its `container.registerDecorator(RestartReviewStepUseCase.createDecorator({ decorator: CountingRestartReviewStep, dependencies: [] }))` registration exactly as Task 16 Step 1 shows (it records `"RestartReviewStep"`), next to the `ReassignReviewStepUseCase` decorator.

Create `packages/api-website-builder-workflows/__tests__/__helpers/seeds.ts` (the package has none; `listReviews.test.ts` seeds its failed AI step inline, leave that test alone):

```ts
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { ReviewData, ReviewStep } from "@webiny/api-workflows/domain/review/types.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { getAutomationActor } from "@webiny/api-workflows/domain/automation/getAutomationActor.js";
import { expectOk } from "./pages.js";
import { TEST_AUTOMATION_ID } from "./TestAutomationDefinition.js";

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

/** The same review with its step `rejected`: the state the engine refuses to restart (R140). */
export const seedRejectedStep = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(ReviewRepository).save({
            ...review,
            currentStepState: "rejected",
            steps: review.steps.map((step): ReviewStep => ({ ...step, state: "rejected" }))
        })
    );
};
```

In `packages/api-website-builder-workflows/__tests__/__helpers/graphql.ts` add (next to `REASSIGN_STEP`):

```ts
export const RESTART_STEP = /* GraphQL */ `
    mutation RestartStep($reviewId: ID!, $stepId: ID!) {
        websiteBuilder {
            restartWebsiteBuilderPageReviewStep(reviewId: $reviewId, stepId: $stepId) {
                data {
                    id
                    currentStepState
                    steps { id state comment taskId runs { taskId outcome reason } }
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;
```

In `packages/api-website-builder-workflows/__tests__/registration.test.ts` add `import { RestartWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/RestartWebsiteBuilderPageReviewStep/index.js";` and `RestartWebsiteBuilderPageReviewStepUseCase,` to the wrapper list after `ReassignWebsiteBuilderPageReviewStepUseCase`.

In `packages/api-website-builder-workflows/__tests__/graphql/license.test.ts` add `"restartWebsiteBuilderPageReviewStep"` to `MUTATIONS` after `"reassignWebsiteBuilderPageReviewStep"`.

Create `packages/api-website-builder-workflows/__tests__/wrappers/restartReviewStep.test.ts`. The scenario mirrors `routingWrappers.test.ts` (`createScenario`, `asUser`): REQUESTER is the requester, REASSIGNER holds `reassign`, REVIEWER holds neither:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { requestPageReview, STEP_ID, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import {
    FAILED_REASON,
    seedFailedAutomationStep,
    seedRejectedStep
} from "~tests/__helpers/seeds.js";
import {
    REASSIGNER,
    REQUESTER,
    REVIEWER,
    WB_READER,
    WB_WRITER,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/identities.js";
import { expectOk } from "~tests/__helpers/pages.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import {
    registerFakeTaskService,
    resetFakeTasks,
    triggeredTasks
} from "~tests/__helpers/FakeTaskService.js";
import { registerFakeGetTask } from "~tests/__helpers/FakeGetTask.js";
import { RestartWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/RestartWebsiteBuilderPageReviewStep/index.js";

const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...WB_READER];
const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: WB_WRITER,
    [REVIEWER.id]: WB_READER
};

/**
 * Admin stores the pages workflow and REQUESTER asks for reviews of "Page A" (root) and "Locked"
 * ("folder-locked"); the only step of each is then a failed automation run.
 */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    const review = await seedFailedAutomationStep(admin, await requestPageReview(admin, page));
    const lockedReview = await seedFailedAutomationStep(
        admin,
        await requestPageReview(admin, lockedPage)
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
            registerTestUsers,
            registerTestAutomation,
            registerFakeTaskService,
            registerFakeGetTask,
            countEngineCalls,
            scriptTargetReads,
            throwOnAccessChecks,
            ...legacyPlugins
        ]
    });
};

const restart = (context: CmsContext, reviewId: string, stepId: string = STEP_ID) => {
    return context.container
        .resolve(RestartWebsiteBuilderPageReviewStepUseCase)
        .execute({ reviewId, stepId });
};

describe("WB restart wrapper", () => {
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
        const requester = await asUser(REQUESTER, WB_WRITER);

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
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = await restart(reviewer, review.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "restart a review step" });
        expect(engineCalls).not.toContain("RestartReviewStep");
        expect(triggeredTasks).toEqual([]);
    });

    it("refuses a requester without read access to the page, before the engine", async () => {
        const { lockedReview } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REQUESTER.id, "no-access"]]));
        const requester = await asUser(REQUESTER, WB_WRITER);

        const result = await restart(requester, lockedReview.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "restart a review step" });
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("passes the engine's state errors through unchanged and triggers nothing", async () => {
        const { admin, review } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);
        const rejected = await seedRejectedStep(admin, review);

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
        const requester = await asUser(REQUESTER, WB_WRITER, [throwOnWorkflowsPermissions]);

        const result = await restart(requester, review.id);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("reports a Headless CMS review as not found (R46)", async () => {
        const cmsReview = await createCmsReview(await createUserContext());
        const requester = await asUser(REQUESTER, WB_WRITER);

        const result = await restart(requester, cmsReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("refuses an anonymous identity and fails with a persistence error when the read check throws (R87)", async () => {
        const { review } = await createScenario();
        const anonymous = await asUser(null, []);
        const requester = await asUser(REQUESTER, WB_WRITER);

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

Create `packages/api-website-builder-workflows/__tests__/graphql/pageRestart.test.ts`, with the scenario shape of `pageRouting.test.ts` (`graphQLUserFor` adds `registerTestAutomation, registerFakeTaskService, registerFakeGetTask` to its `legacyPlugins`; `run` returns `data.websiteBuilder`; `createScenario` seeds the failed step with `seedFailedAutomationStep`; `RESTART_STEP` and `GET_REVIEW` come from `~tests/__helpers/graphql.js`; `resetFakeTasks`, `engineCalls` and `folderLevels` are imported like in the wrapper test):

```ts
describe("WB restart GraphQL", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        resetFakeTasks();
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("restarts a failed step and returns the new run data (R158)", async () => {
        const { review } = await createScenario();
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);

        const before = await run(requester, GET_REVIEW, { id: review.id });
        const restarted = await run(requester, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });
        const after = await run(requester, GET_REVIEW, { id: review.id });

        expect(before.getWebsiteBuilderPageReview.data.flags.canRestart).toBe(true);
        expect(restarted.restartWebsiteBuilderPageReviewStep.error).toBeNull();
        expect(restarted.restartWebsiteBuilderPageReviewStep.data).toMatchObject({
            id: review.id,
            currentStepState: "inReview"
        });
        expect(restarted.restartWebsiteBuilderPageReviewStep.data.steps[0]).toMatchObject({
            taskId: "task-1",
            runs: [{ taskId: "task-old", outcome: "failed", reason: FAILED_REASON }]
        });
        expect(after.getWebsiteBuilderPageReview.data.flags.canRestart).toBe(false);
    });

    it("returns the refusal with code and data for a viewer without reassign (R125)", async () => {
        const { review } = await createScenario();
        const reviewer = graphQLUserFor(REVIEWER, WB_READER);

        const refused = await run(reviewer, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });
        const flags = await run(reviewer, GET_REVIEW, { id: review.id });

        expect(refused.restartWebsiteBuilderPageReviewStep).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to restart a review step.",
                data: { action: "restart a review step" }
            }
        });
        expect(flags.getWebsiteBuilderPageReview.data.flags.canRestart).toBe(false);
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("returns the engine's invalid-state error for a step that is not failed", async () => {
        const { review } = await createScenario();
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);
        await run(requester, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });

        const again = await run(requester, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });

        expect(again.restartWebsiteBuilderPageReviewStep.data).toBeNull();
        expect(again.restartWebsiteBuilderPageReviewStep.error).toMatchObject({
            code: "Workflows/Review/InvalidState",
            data: { transition: "restart" }
        });
    });

    it("reports a Headless CMS review as not found and leaves it unchanged (R46)", async () => {
        const cmsReview = await createCmsReview(await createUserContext());
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);

        const result = await run(requester, RESTART_STEP, {
            reviewId: cmsReview.id,
            stepId: STEP_ID
        });

        expect(result.restartWebsiteBuilderPageReviewStep.data).toBeNull();
        expect(result.restartWebsiteBuilderPageReviewStep.error).toMatchObject({
            code: "Workflows/Review/NotFound",
            data: { id: cmsReview.id }
        });
        expect(engineCalls).not.toContain("RestartReviewStep");
    });

    it("refuses an anonymous identity", async () => {
        const { review } = await createScenario();
        const anonymous = graphQLUserFor(null, []);

        const result = await run(anonymous, RESTART_STEP, { reviewId: review.id, stepId: STEP_ID });

        expect(result.restartWebsiteBuilderPageReviewStep.error.code).toBe(
            "Workflows/NotAuthenticated"
        );
    });
});
```

(The license gate is pinned by the `license.test.ts` edit above.)

- [ ] **Step 2: Run the tests and see them fail**

```bash
yarn test packages/api-website-builder-workflows/__tests__/wrappers/restartReviewStep.test.ts 2>&1 | tail -30
yarn test packages/api-website-builder-workflows/__tests__/graphql/pageRestart.test.ts 2>&1 | tail -30
```

Expected: FAIL, the use case module does not exist.

- [ ] **Step 3: Implement the wrapper**

`packages/api-website-builder-workflows/src/features/wrappers/RestartWebsiteBuilderPageReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { RestartReviewStepUseCase } from "@webiny/api-workflows/features/review/RestartReviewStep/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface RestartWebsiteBuilderPageReviewStepInput {
    reviewId: string;
    stepId: string;
}

export interface IRestartWebsiteBuilderPageReviewStepUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    restart: RestartReviewStepUseCase.Error;
}

type UseCaseError =
    IRestartWebsiteBuilderPageReviewStepUseCaseErrors[keyof IRestartWebsiteBuilderPageReviewStepUseCaseErrors];

export interface IRestartWebsiteBuilderPageReviewStepUseCase {
    execute(input: RestartWebsiteBuilderPageReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Run a failed page review step again (spec 5.1, D8, D34, D82, R153): read access to the page
 * and the requester or `reassign` here, the step's state in the engine.
 */
export const RestartWebsiteBuilderPageReviewStepUseCase =
    createAbstraction<IRestartWebsiteBuilderPageReviewStepUseCase>("RestartWebsiteBuilderPageReviewStepUseCase");

export namespace RestartWebsiteBuilderPageReviewStepUseCase {
    export type Interface = IRestartWebsiteBuilderPageReviewStepUseCase;
    export type Input = RestartWebsiteBuilderPageReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

`RestartWebsiteBuilderPageReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { RestartReviewStepUseCase } from "@webiny/api-workflows/features/review/RestartReviewStep/index.js";
import { canRestartByPermission } from "@webiny/api-workflows/domain/review/canRestartByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { RestartWebsiteBuilderPageReviewStepUseCase as UseCase } from "./abstractions.js";

const ACTION = "restart a review step";

class RestartWebsiteBuilderPageReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
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

export const RestartWebsiteBuilderPageReviewStepUseCase = UseCase.createImplementation({
    implementation: RestartWebsiteBuilderPageReviewStepUseCaseImpl,
    dependencies: [WbPageReviewGuardService, RestartReviewStepUseCase]
});
```

`feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RestartWebsiteBuilderPageReviewStepUseCase } from "./RestartWebsiteBuilderPageReviewStepUseCase.js";

export const RestartWebsiteBuilderPageReviewStepFeature = createFeature({
    name: "WebsiteBuilderWorkflows/RestartWebsiteBuilderPageReviewStep",
    register(container) {
        container.register(RestartWebsiteBuilderPageReviewStepUseCase);
    }
});
```

`index.ts`:

```ts
export { RestartWebsiteBuilderPageReviewStepUseCase } from "./abstractions.js";
export type { RestartWebsiteBuilderPageReviewStepInput } from "./abstractions.js";
```

In `src/features/wrappers/feature.ts` import `RestartWebsiteBuilderPageReviewStepFeature` from `./RestartWebsiteBuilderPageReviewStep/feature.js` and call `RestartWebsiteBuilderPageReviewStepFeature.register(container);` after `ReassignWebsiteBuilderPageReviewStepFeature.register(container);` (the "Reviews" group).

- [ ] **Step 4: Add the GraphQL mutation**

In `src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`: import `RestartWebsiteBuilderPageReviewStepUseCase` from `~/features/wrappers/RestartWebsiteBuilderPageReviewStep/index.js`; in the `WbMutation` type defs add after `reassignWebsiteBuilderPageReviewStep(...)`:

```graphql
        restartWebsiteBuilderPageReviewStep(reviewId: ID!, stepId: ID!): WbPageReviewResponse!
```

and after the `reassignWebsiteBuilderPageReviewStep` resolver add:

```ts
        builder.addResolver<RestartWebsiteBuilderPageReviewStepUseCase.Input>({
            path: "WbMutation.restartWebsiteBuilderPageReviewStep",
            dependencies: [RestartWebsiteBuilderPageReviewStepUseCase],
            resolver: (restartStep: RestartWebsiteBuilderPageReviewStepUseCase.Interface) => {
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
yarn test packages/api-website-builder-workflows/__tests__/wrappers/restartReviewStep.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/graphql/pageRestart.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/wrappers/restartReviewStep.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/graphql/pageRestart.test.ts 2>&1 | tail -50
```

Run the `:os` commands one at a time (parallel runs clash on port 8001). Then the registration test, the license test and one earlier file per touched helper (`CountingEngineCalls`, `graphql.ts`), each by path with `yarn test:os`: `__tests__/registration.test.ts`, the license test named above, `__tests__/wrappers/reviewTransitions.test.ts`.

Expected: PASS on both storages.

- [ ] **Step 6: Typecheck and commit**

```bash
yarn tsc -p packages/api-website-builder-workflows/tsconfig.build.json --noEmit 2>&1 | tail -10
```

Then the Before Commit chain from `CLAUDE.md` (`yarn` for the lockfile, `format:fix`, `lint:fix`, `adio`, ts-configs check). `zod` is a devDependency only (tests); `adio` must stay clean. Commit:

```
feat(api-website-builder-workflows): add the restart review step wrapper and graphql mutation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
