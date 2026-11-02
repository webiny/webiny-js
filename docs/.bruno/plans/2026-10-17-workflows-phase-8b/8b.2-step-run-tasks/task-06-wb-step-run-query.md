### Task 6: WB `getWebsiteBuilderPageReviewStepRun`

R257, R258, R146, R87, R46, D132, D90, D161; Review Focus 1, 2 (`00-shared.md`). The phase 8a Global Constraints and Rulings R202-R252 apply unchanged (read: R87/D132 wrappers authorize and the shared use case checks nothing, never throw out of a resolver, one class or one public function per file, one named import per line, namespace types, no logic duplicated across CMS and WB beyond the thin wrapper that mirrors the app's guard, targeted tests, the pre-commit chain).

The Website Builder wrapper is Task 5's wrapper over the page guard. Both wrappers hold only the app-specific part (their guard, their GraphQL root); the read, the permission predicate (`canViewStepRunByPermission`) and the info type are shared from `api-workflows` (Task 4), so nothing is duplicated.

- **`GetWebsiteBuilderPageReviewStepRunUseCase`** (`[WBA]/features/wrappers/GetWebsiteBuilderPageReviewStepRun/`: `abstractions.ts`, `GetWebsiteBuilderPageReviewStepRunUseCase.ts`, `feature.ts`, `index.ts`). Input `GetWebsiteBuilderPageReviewStepRunInput { reviewId: string; stepId: string; taskId: string }`; dependencies `[WbPageReviewGuardService, GetReviewStepRunUseCase]`.
- **Flow** (the order of the restart wrapper):
  1. `guard.authorize({ reviewId, action: "view a step run" })`: a signed-in viewer (`Workflows/NotAuthenticated`), a `wb.page` review (another app's review is `Workflows/Review/NotFound`, R46) and read access to the page through Website Builder's own logic (`Workflows/NotAuthorized` with data `{ action: "view a step run" }`).
  2. `canViewStepRunByPermission(viewer)` (R258): without `editor` or `reassign`, `WorkflowsNotAuthorizedError({ action: "view a step run" })` (message "You are not allowed to view a step run."). The requester is not exempt.
  3. `GetReviewStepRunUseCase.execute({ reviewId, stepId, taskId })`; `Workflows/Review/StepRunNotFound` and `null` (task gone) pass through.
- **GraphQL** (`[WBA]/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`): `type WbPageReviewStepRunResponse { data: WorkflowsStepRunInfo error: WorkflowsError }`, `WbQuery.getWebsiteBuilderPageReviewStepRun(reviewId: ID!, stepId: ID!, taskId: ID!): WbPageReviewStepRunResponse!` and its resolver, inline (failed Result -> `ErrorResponse`, otherwise `Response`).
- Differences from Task 5 that matter for the tests: the `websiteBuilder` root, the page fixtures (`createPage`, `requestPageReview`, `storeWbWorkflow`), the `WB_READER` / `WB_WRITER` permissions, and a Headless CMS review id as the "other app" case.

**Files:**
- Create: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReviewStepRun/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReviewStepRun/GetWebsiteBuilderPageReviewStepRunUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReviewStepRun/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReviewStepRun/index.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/ScriptedGetTask.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/CountingEngineCalls.ts`
- Create: `packages/api-website-builder-workflows/__tests__/wrappers/getReviewStepRun.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/graphql/pageStepRun.test.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/graphql/license.test.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes: Task 4 (`GetReviewStepRunUseCase` from `@webiny/api-workflows/features/stepRun/GetReviewStepRun/index.js`, `ReviewStepRunInfo` from `@webiny/api-workflows/domain/review/ReviewStepRunInfo.js`, `canViewStepRunByPermission` from `@webiny/api-workflows/domain/review/canViewStepRunByPermission.js`, the `WorkflowsStepRunInfo` GraphQL type); existing (verified with codegraph and the source): `WbPageReviewGuardService` (`authorize(params: { reviewId; action }): Promise<Result<{ review: ReviewData; viewer: ReviewViewer }, GuardError>>`, `~/features/wrappers/WbPageReviewGuardService/index.js`), `WorkflowsNotAuthorizedError` (`@webiny/api-workflows/domain/permissions/errors.js`), `ErrorResponse`, `Response` (`@webiny/api-graphql`). Test helpers of the package (existing unless marked new): `createUserContext` (`~tests/__helpers/userContext.js`), `asGraphQLUser` (`~tests/__helpers/graphql.js`), `createPage`, `expectOk` (`~tests/__helpers/pages.js`), `requestPageReview`, `STEP_ID`, `storeWbWorkflow` (`~tests/__helpers/engine.js`), `createCmsReview` (`~tests/__helpers/cmsReview.js`), `FAILED_REASON`, `seedFailedAutomationStep` (`~tests/__helpers/seeds.js`), `registerTestUsers`, `EDITOR`, `REASSIGNER`, `REQUESTER`, `REVIEWER`, `WB_READER`, `WB_WRITER`, `WORKFLOWS_EDITOR`, `WORKFLOWS_REASSIGN` (`~tests/__helpers/identities.js`), `folderLevels`, `countEngineCalls`, `engineCalls`, `scriptTargetReads`, `throwOnAccessChecks`, `throwingAccessChecks`, `registerTestAutomation`; new `registerScriptedGetTask`, `putScriptedTask`, `resetScriptedTasks`, `scriptedTaskReads` (`~tests/__helpers/ScriptedGetTask.js`).
- Produces (matches the contract): `GetWebsiteBuilderPageReviewStepRunUseCase.execute(input: GetWebsiteBuilderPageReviewStepRunInput): Promise<Result<ReviewStepRunInfo | null, GuardError | WorkflowsNotAuthorizedError | GetReviewStepRunUseCase.Error>>` with the namespace `.Interface`, `.Input`, `.Error`, `.Return`; `GetWebsiteBuilderPageReviewStepRunInput`; the GraphQL type `WbPageReviewStepRunResponse` and query `getWebsiteBuilderPageReviewStepRun`. Consumed by Task 9 (the WB gateway document).

**Test runner note:** API package: each test file runs with `yarn test <path>` and then `yarn test:os <path>` (one `test:os` run at a time). Task 4 must be built first (`yarn build -p @webiny/api-workflows --no-cache`).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-website-builder-workflows/__tests__/__helpers/ScriptedGetTask.ts` (this package's context registers the real `BackgroundTasksFeature`, so the real task read is replaced by a scripted one through `legacyPlugins`, as `registerFakeGetTask` does):

```ts
import type { Container } from "@webiny/di";
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";

export interface ScriptedTaskParams {
    status?: TaskDataStatus;
    iterations?: number;
    startedOn?: string;
    finishedOn?: string;
    input?: TaskService.Task["input"];
    output?: TaskService.Task["output"];
}

export interface ScriptedTaskReads {
    /** Thrown by every read when set. */
    failure: Error | null;
    /** Every task id that was read, in order. */
    ids: string[];
}

const NOW = "2026-10-13T10:00:00.000Z";

const tasks = new Map<string, TaskService.Task>();

export const scriptedTaskReads: ScriptedTaskReads = { failure: null, ids: [] };

/** Stores a task the scripted read answers with. */
export const putScriptedTask = (id: string, params: ScriptedTaskParams = {}): void => {
    tasks.set(id, {
        id,
        name: "Workflow step: Check links",
        definitionId: "workflowsStepRun",
        executionName: "",
        input: params.input ?? { reviewId: "review", stepId: "step-1" },
        output: params.output,
        iterations: params.iterations ?? 1,
        taskStatus: params.status ?? TaskDataStatus.FAILED,
        eventResponse: undefined,
        startedOn: params.startedOn,
        finishedOn: params.finishedOn,
        createdOn: NOW,
        savedOn: NOW,
        createdBy: { id: "user-requester", displayName: "Rita Requester", type: "admin" }
    });
};

/** Clears the stored tasks, the failure and the recorded reads; call it in `beforeEach`. */
export const resetScriptedTasks = (): void => {
    tasks.clear();
    scriptedTaskReads.failure = null;
    scriptedTaskReads.ids.length = 0;
};

class ScriptedGetTask implements GetTaskUseCase.Interface {
    public async execute<I extends TaskService.TaskInput, O extends TaskService.GenericOutput>(
        id: string
    ): Promise<TaskService.Task<I, O> | null> {
        scriptedTaskReads.ids.push(id);
        if (scriptedTaskReads.failure) {
            throw scriptedTaskReads.failure;
        }
        return (tasks.get(id) ?? null) as unknown as TaskService.Task<I, O> | null;
    }
}

/** Replaces the context's task read (`legacyPlugins`: function plugins run last, last wins). */
export const registerScriptedGetTask = (container: Container) => {
    container.registerInstance(GetTaskUseCase, new ScriptedGetTask());
};
```

Modify `packages/api-website-builder-workflows/__tests__/__helpers/CountingEngineCalls.ts`: count the new engine use case, so a refused wrapper call can be shown not to reach it.

Before:

```ts
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
```

After:

```ts
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { GetReviewStepRunUseCase } from "@webiny/api-workflows/features/stepRun/GetReviewStepRun/index.js";
```

Before:

```ts
class CountingGetTargetReview implements GetTargetReviewUseCase.Interface {
```

After:

```ts
class CountingGetReviewStepRun implements GetReviewStepRunUseCase.Interface {
    public constructor(private decoratee: GetReviewStepRunUseCase.Interface) {}

    public async execute(input: GetReviewStepRunUseCase.Input): GetReviewStepRunUseCase.Return {
        engineCalls.push("GetReviewStepRun");
        return this.decoratee.execute(input);
    }
}

class CountingGetTargetReview implements GetTargetReviewUseCase.Interface {
```

Before:

```ts
    container.registerDecorator(
        GetReviewUseCase.createDecorator({ decorator: CountingGetReview, dependencies: [] })
    );
```

After:

```ts
    container.registerDecorator(
        GetReviewUseCase.createDecorator({ decorator: CountingGetReview, dependencies: [] })
    );
    container.registerDecorator(
        GetReviewStepRunUseCase.createDecorator({
            decorator: CountingGetReviewStepRun,
            dependencies: []
        })
    );
```

Create `packages/api-website-builder-workflows/__tests__/wrappers/getReviewStepRun.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import type { ReviewData, ReviewStepRun } from "@webiny/api-workflows/domain/review/types.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { requestPageReview, STEP_ID, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import { FAILED_REASON, seedFailedAutomationStep } from "~tests/__helpers/seeds.js";
import {
    EDITOR,
    REASSIGNER,
    REQUESTER,
    REVIEWER,
    WB_READER,
    WB_WRITER,
    WORKFLOWS_EDITOR,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { scriptTargetReads } from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import {
    putScriptedTask,
    registerScriptedGetTask,
    resetScriptedTasks,
    scriptedTaskReads
} from "~tests/__helpers/ScriptedGetTask.js";
import { GetWebsiteBuilderPageReviewStepRunUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReviewStepRun/index.js";

const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...WB_READER];
const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...WB_READER];
const ACTION = { action: "view a step run" };

/** The seeded current attempt of the automation step (`seeds.ts`): task `task-old`. */
const CURRENT_TASK_ID = "task-old";
const CURRENT_STARTED = "2026-10-13T10:00:00.000Z";
const CURRENT_FINISHED = "2026-10-13T10:01:00.000Z";

/** An earlier attempt of the same step; its task is `task-earlier`. */
const EARLIER_RUN: ReviewStepRun = {
    taskId: "task-earlier",
    startedOn: "2026-10-13T09:00:00.000Z",
    finishedOn: "2026-10-13T09:05:00.000Z",
    outcome: "failed",
    reason: "The automation was aborted."
};

const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: WB_WRITER,
    [REVIEWER.id]: WB_READER
};

/** Stores the review with the given task ids on its steps and the given earlier runs. */
const withTasks = async (
    context: CmsContext,
    review: ReviewData,
    taskId: string,
    runs: ReviewStepRun[]
): Promise<ReviewData> => {
    const steps = review.steps.map(step => ({ ...step, taskId, runs }));
    return expectOk(await context.container.resolve(ReviewRepository).save({ ...review, steps }));
};

/**
 * Admin stores the pages workflow and REQUESTER asks for three reviews, each with a failed
 * automation step: "Page A" (root; current task `task-old` after the earlier run `task-earlier`),
 * "Locked" in "folder-locked" and "Page B" (current task `task-bob`).
 */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    const otherPage = await createPage(admin, { title: "Page B" });
    const seeded = await seedFailedAutomationStep(admin, await requestPageReview(admin, page));
    const review = await withTasks(admin, seeded, CURRENT_TASK_ID, [EARLIER_RUN]);
    const lockedSeeded = await seedFailedAutomationStep(
        admin,
        await requestPageReview(admin, lockedPage)
    );
    const lockedReview = await withTasks(admin, lockedSeeded, CURRENT_TASK_ID, []);
    const otherSeeded = await seedFailedAutomationStep(
        admin,
        await requestPageReview(admin, otherPage)
    );
    const otherReview = await withTasks(admin, otherSeeded, "task-other", []);
    return { review, lockedReview, otherReview };
};

const asUser = (
    identity: IdentityData | null,
    permissions: SecurityPermission[]
): Promise<CmsContext> => {
    return createUserContext({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [
            registerTestUsers,
            registerTestAutomation,
            countEngineCalls,
            scriptTargetReads,
            throwOnAccessChecks,
            registerScriptedGetTask
        ]
    });
};

const readStepRun = (context: CmsContext, reviewId: string, taskId: string) => {
    return context.container
        .resolve(GetWebsiteBuilderPageReviewStepRunUseCase)
        .execute({ reviewId, stepId: STEP_ID, taskId });
};

describe("WB step run wrapper (R257, R258)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        resetScriptedTasks();
    });

    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
    });

    it("lets an editor read the current attempt", async () => {
        const { review } = await createScenario();
        putScriptedTask(CURRENT_TASK_ID, { status: TaskDataStatus.FAILED });
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const info = expectOk(await readStepRun(editor, review.id, CURRENT_TASK_ID));

        expect(info).toEqual({
            taskId: CURRENT_TASK_ID,
            status: "failed",
            startedOn: CURRENT_STARTED,
            finishedOn: CURRENT_FINISHED,
            iterations: 1,
            outcome: "failed",
            reason: FAILED_REASON
        });
        expect(engineCalls).toEqual(["GetReview", "GetReviewStepRun"]);
    });

    it("lets a viewer with reassign read an earlier attempt", async () => {
        const { review } = await createScenario();
        putScriptedTask("task-earlier", { status: TaskDataStatus.ABORTED });
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const info = expectOk(await readStepRun(reassigner, review.id, "task-earlier"));

        expect(info).toEqual({
            taskId: "task-earlier",
            status: "aborted",
            startedOn: EARLIER_RUN.startedOn,
            finishedOn: EARLIER_RUN.finishedOn,
            iterations: 1,
            outcome: "failed",
            reason: "The automation was aborted."
        });
    });

    it("refuses the requester and a reader without editor or reassign, before the engine and the task", async () => {
        const { review } = await createScenario();
        putScriptedTask(CURRENT_TASK_ID);
        const requester = await asUser(REQUESTER, WB_WRITER);
        const reviewer = await asUser(REVIEWER, WB_READER);

        const refusedRequester = await readStepRun(requester, review.id, CURRENT_TASK_ID);
        const refusedReviewer = await readStepRun(reviewer, review.id, CURRENT_TASK_ID);

        expect(refusedRequester.error?.code).toBe("Workflows/NotAuthorized");
        expect(refusedRequester.error?.data).toEqual(ACTION);
        expect(refusedRequester.error?.message).toBe("You are not allowed to view a step run.");
        expect(refusedReviewer.error?.code).toBe("Workflows/NotAuthorized");
        expect(engineCalls).toEqual(["GetReview", "GetReview"]);
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("refuses an editor without read access to the page, before the engine and the task", async () => {
        const { lockedReview } = await createScenario();
        putScriptedTask(CURRENT_TASK_ID);
        folderLevels.set("folder-locked", new Map([[EDITOR.id, "no-access"]]));
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, lockedReview.id, CURRENT_TASK_ID);

        expect(result.error?.code).toBe("Workflows/NotAuthorized");
        expect(result.error?.data).toEqual(ACTION);
        expect(engineCalls).toEqual(["GetReview"]);
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("reports a Headless CMS review as not found (R46)", async () => {
        const cmsReview = await createCmsReview(await createUserContext());
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, cmsReview.id, CURRENT_TASK_ID);

        expect(result.error?.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).toEqual(["GetReview"]);
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("refuses an anonymous identity", async () => {
        const { review } = await createScenario();
        const anonymous = await asUser(null, []);

        const result = await readStepRun(anonymous, review.id, CURRENT_TASK_ID);

        expect(result.error?.code).toBe("Workflows/NotAuthenticated");
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("answers a task id that is not on the step with StepRunNotFound and reads no task", async () => {
        const { review } = await createScenario();
        putScriptedTask("task-unknown");
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, review.id, "task-unknown");

        expect(result.error?.code).toBe("Workflows/Review/StepRunNotFound");
        expect(result.error?.data).toEqual({
            reviewId: review.id,
            stepId: STEP_ID,
            taskId: "task-unknown"
        });
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("answers another review's task id with StepRunNotFound and reads no task", async () => {
        const { review } = await createScenario();
        putScriptedTask("task-other");
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, review.id, "task-other");

        expect(result.error?.code).toBe("Workflows/Review/StepRunNotFound");
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("answers null when the task record is gone", async () => {
        const { review } = await createScenario();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, review.id, CURRENT_TASK_ID);

        expect(expectOk(result)).toBeNull();
        expect(scriptedTaskReads.ids).toEqual([CURRENT_TASK_ID]);
    });

    it("fails with a persistence error when the task read throws (R87)", async () => {
        const { review } = await createScenario();
        scriptedTaskReads.failure = new Error("The task store is down.");
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, review.id, CURRENT_TASK_ID);

        expect(result.error?.code).toBe("Workflows/Review/Persistence");
    });

    it("never returns the task's raw error, input or output (R146)", async () => {
        const { review } = await createScenario();
        putScriptedTask(CURRENT_TASK_ID, {
            status: TaskDataStatus.FAILED,
            input: { reviewId: review.id, stepId: STEP_ID, secret: "SECRET-INPUT" },
            output: {
                idWaits: 0,
                state: { secret: "SECRET-STATE" },
                error: { message: "SECRET-RAW-ERROR" }
            }
        });
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const info = expectOk(await readStepRun(editor, review.id, CURRENT_TASK_ID));

        expect(Object.keys(info ?? {}).sort()).toEqual([
            "finishedOn",
            "iterations",
            "outcome",
            "reason",
            "startedOn",
            "status",
            "taskId"
        ]);
        expect(JSON.stringify(info)).not.toContain("SECRET");
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/graphql/pageStepRun.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { requestPageReview, STEP_ID, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import { FAILED_REASON, seedFailedAutomationStep } from "~tests/__helpers/seeds.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import {
    EDITOR,
    REQUESTER,
    WB_READER,
    WB_WRITER,
    WORKFLOWS_EDITOR
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { asGraphQLUser } from "~tests/__helpers/graphql.js";
import {
    putScriptedTask,
    registerScriptedGetTask,
    resetScriptedTasks,
    scriptedTaskReads
} from "~tests/__helpers/ScriptedGetTask.js";

const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: WB_WRITER
};
const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...WB_READER];
const TASK_ID = "task-old";

const GET_STEP_RUN = /* GraphQL */ `
    query GetStepRun($reviewId: ID!, $stepId: ID!, $taskId: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageReviewStepRun(
                reviewId: $reviewId
                stepId: $stepId
                taskId: $taskId
            ) {
                data {
                    taskId
                    status
                    startedOn
                    finishedOn
                    iterations
                    outcome
                    reason
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

/** A `/graphql` user with the scripted task read and the engine call counter. */
const graphQLUserFor = (identity: IdentityData | null, permissions: SecurityPermission[]) => {
    return asGraphQLUser({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [registerTestUsers, registerScriptedGetTask, countEngineCalls]
    });
};

/** Runs the query and returns `data.websiteBuilder.getWebsiteBuilderPageReviewStepRun`. */
const run = async (
    user: ReturnType<typeof asGraphQLUser>,
    variables: Record<string, unknown>
) => {
    const body = await user.run(GET_STEP_RUN, variables);
    expect(body.errors).toBeUndefined();
    return body.data.websiteBuilder.getWebsiteBuilderPageReviewStepRun;
};

/** Admin stores the pages workflow and REQUESTER asks for a review of "Page A"; its step failed as `task-old`. */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const seeded = await seedFailedAutomationStep(admin, await requestPageReview(admin, page));
    const steps = seeded.steps.map(step => ({ ...step, taskId: TASK_ID, runs: [] }));
    const review = expectOk(
        await admin.container.resolve(ReviewRepository).save({ ...seeded, steps })
    );
    return { review };
};

describe("WB step run GraphQL (R257, R258)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        resetScriptedTasks();
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("returns every field of the step run, and nothing of the raw task (R146)", async () => {
        const { review } = await createScenario();
        putScriptedTask(TASK_ID, {
            status: TaskDataStatus.FAILED,
            iterations: 4,
            input: { reviewId: review.id, stepId: STEP_ID, secret: "SECRET-INPUT" },
            output: {
                idWaits: 3,
                state: { secret: "SECRET-STATE" },
                error: { message: "SECRET-RAW-ERROR" }
            }
        });
        const editor = graphQLUserFor(EDITOR, EDITOR_PERMISSIONS);

        const result = await run(editor, { reviewId: review.id, stepId: STEP_ID, taskId: TASK_ID });

        expect(result.error).toBeNull();
        expect(result.data).toMatchObject({
            taskId: TASK_ID,
            status: "failed",
            iterations: 1,
            outcome: "failed",
            reason: FAILED_REASON
        });
        expect(new Date(result.data.startedOn).toISOString()).toBe("2026-10-13T10:00:00.000Z");
        expect(new Date(result.data.finishedOn).toISOString()).toBe("2026-10-13T10:01:00.000Z");
        expect(JSON.stringify(result)).not.toContain("SECRET");
    });

    it("returns the refusal with code, message and data for a viewer without editor or reassign (R258)", async () => {
        const { review } = await createScenario();
        putScriptedTask(TASK_ID);
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);

        const result = await run(requester, {
            reviewId: review.id,
            stepId: STEP_ID,
            taskId: TASK_ID
        });

        expect(result).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to view a step run.",
                data: { action: "view a step run" }
            }
        });
        expect(engineCalls).not.toContain("GetReviewStepRun");
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("returns null data and no error when the task is gone", async () => {
        const { review } = await createScenario();
        const editor = graphQLUserFor(EDITOR, EDITOR_PERMISSIONS);

        const result = await run(editor, { reviewId: review.id, stepId: STEP_ID, taskId: TASK_ID });

        expect(result).toEqual({ data: null, error: null });
    });

    it("returns StepRunNotFound with its data for a task id that is not on the step", async () => {
        const { review } = await createScenario();
        putScriptedTask("task-unknown");
        const editor = graphQLUserFor(EDITOR, EDITOR_PERMISSIONS);

        const result = await run(editor, {
            reviewId: review.id,
            stepId: STEP_ID,
            taskId: "task-unknown"
        });

        expect(result.data).toBeNull();
        expect(result.error).toMatchObject({
            code: "Workflows/Review/StepRunNotFound",
            data: { reviewId: review.id, stepId: STEP_ID, taskId: "task-unknown" }
        });
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("reports a Headless CMS review as not found (R46)", async () => {
        const cmsReview = await createCmsReview(await createUserContext());
        const editor = graphQLUserFor(EDITOR, EDITOR_PERMISSIONS);

        const result = await run(editor, {
            reviewId: cmsReview.id,
            stepId: STEP_ID,
            taskId: TASK_ID
        });

        expect(result.data).toBeNull();
        expect(result.error).toMatchObject({
            code: "Workflows/Review/NotFound",
            data: { id: cmsReview.id }
        });
        expect(engineCalls).not.toContain("GetReviewStepRun");
    });

    it("refuses an anonymous identity", async () => {
        const { review } = await createScenario();
        const anonymous = graphQLUserFor(null, []);

        const result = await run(anonymous, {
            reviewId: review.id,
            stepId: STEP_ID,
            taskId: TASK_ID
        });

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
    });
});
```

Modify `packages/api-website-builder-workflows/__tests__/graphql/license.test.ts` (the query is added with the license and not without it).

Before:

```ts
    "getWebsiteBuilderPageTargetReview",
    "listWebsiteBuilderPageReviews",
```

After:

```ts
    "getWebsiteBuilderPageTargetReview",
    "getWebsiteBuilderPageReviewStepRun",
    "listWebsiteBuilderPageReviews",
```

Modify `packages/api-website-builder-workflows/__tests__/registration.test.ts`.

Before:

```ts
import { GetWebsiteBuilderPageTargetReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageTargetReview/index.js";
```

After:

```ts
import { GetWebsiteBuilderPageTargetReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageTargetReview/index.js";
import { GetWebsiteBuilderPageReviewStepRunUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReviewStepRun/index.js";
```

Before:

```ts
    GetWebsiteBuilderPageTargetReviewUseCase,
    ReassignWebsiteBuilderPageReviewStepUseCase,
```

After:

```ts
    GetWebsiteBuilderPageTargetReviewUseCase,
    GetWebsiteBuilderPageReviewStepRunUseCase,
    ReassignWebsiteBuilderPageReviewStepUseCase,
```

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-website-builder-workflows/__tests__/wrappers/getReviewStepRun.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/graphql/pageStepRun.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/graphql/license.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. The wrapper test and the registration test fail to load `~/features/wrappers/GetWebsiteBuilderPageReviewStepRun/index.js`; the GraphQL test fails with a validation error (`Cannot query field "getWebsiteBuilderPageReviewStepRun" on type "WbQuery"`); the license test fails on the missing query name.

- [ ] **Step 3: Implement**

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReviewStepRun/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewStepRunInfo } from "@webiny/api-workflows/domain/review/ReviewStepRunInfo.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { GetReviewStepRunUseCase } from "@webiny/api-workflows/features/stepRun/GetReviewStepRun/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface GetWebsiteBuilderPageReviewStepRunInput {
    reviewId: string;
    stepId: string;
    /** The step's current task id or the task id of one of its earlier runs. */
    taskId: string;
}

export interface IGetWebsiteBuilderPageReviewStepRunUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    stepRun: GetReviewStepRunUseCase.Error;
}

type UseCaseError =
    IGetWebsiteBuilderPageReviewStepRunUseCaseErrors[keyof IGetWebsiteBuilderPageReviewStepRunUseCaseErrors];

export interface IGetWebsiteBuilderPageReviewStepRunUseCase {
    execute(
        input: GetWebsiteBuilderPageReviewStepRunInput
    ): Promise<Result<ReviewStepRunInfo | null, UseCaseError>>;
}

/**
 * The background task of one attempt of a page review step, as workflows shows it (R257, R258,
 * D90, D161): read access to the page and `editor` or `reassign` here, the step and task checks in
 * the engine. `null` means the task record is gone.
 */
export const GetWebsiteBuilderPageReviewStepRunUseCase =
    createAbstraction<IGetWebsiteBuilderPageReviewStepRunUseCase>(
        "GetWebsiteBuilderPageReviewStepRunUseCase"
    );

export namespace GetWebsiteBuilderPageReviewStepRunUseCase {
    export type Interface = IGetWebsiteBuilderPageReviewStepRunUseCase;
    export type Input = GetWebsiteBuilderPageReviewStepRunInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewStepRunInfo | null, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReviewStepRun/GetWebsiteBuilderPageReviewStepRunUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { GetReviewStepRunUseCase } from "@webiny/api-workflows/features/stepRun/GetReviewStepRun/index.js";
import { canViewStepRunByPermission } from "@webiny/api-workflows/domain/review/canViewStepRunByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { GetWebsiteBuilderPageReviewStepRunUseCase as UseCase } from "./abstractions.js";

const ACTION = "view a step run";

class GetWebsiteBuilderPageReviewStepRunUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
        private getStepRun: GetReviewStepRunUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: ACTION
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        // Operators only (R258): the requester is not exempt.
        const { viewer } = authorized.value;
        if (!canViewStepRunByPermission(viewer)) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: ACTION }));
        }

        return this.getStepRun.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            taskId: input.taskId
        });
    }
}

export const GetWebsiteBuilderPageReviewStepRunUseCase = UseCase.createImplementation({
    implementation: GetWebsiteBuilderPageReviewStepRunUseCaseImpl,
    dependencies: [WbPageReviewGuardService, GetReviewStepRunUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReviewStepRun/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetWebsiteBuilderPageReviewStepRunUseCase } from "./GetWebsiteBuilderPageReviewStepRunUseCase.js";

export const GetWebsiteBuilderPageReviewStepRunFeature = createFeature({
    name: "WebsiteBuilderWorkflows/GetWebsiteBuilderPageReviewStepRun",
    register(container) {
        container.register(GetWebsiteBuilderPageReviewStepRunUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReviewStepRun/index.ts`:

```ts
export { GetWebsiteBuilderPageReviewStepRunUseCase } from "./abstractions.js";
export type { GetWebsiteBuilderPageReviewStepRunInput } from "./abstractions.js";
```

Modify `packages/api-website-builder-workflows/src/features/wrappers/feature.ts`.

Before:

```ts
import { GetWebsiteBuilderPageTargetReviewFeature } from "./GetWebsiteBuilderPageTargetReview/feature.js";
```

After:

```ts
import { GetWebsiteBuilderPageTargetReviewFeature } from "./GetWebsiteBuilderPageTargetReview/feature.js";
import { GetWebsiteBuilderPageReviewStepRunFeature } from "./GetWebsiteBuilderPageReviewStepRun/feature.js";
```

Before:

```ts
        GetWebsiteBuilderPageTargetReviewFeature.register(container);
        ListWebsiteBuilderPageReviewsFeature.register(container);
```

After:

```ts
        GetWebsiteBuilderPageTargetReviewFeature.register(container);
        GetWebsiteBuilderPageReviewStepRunFeature.register(container);
        ListWebsiteBuilderPageReviewsFeature.register(container);
```

Modify `packages/api-website-builder-workflows/src/graphql/WebsiteBuilderWorkflowsSchemaFactory.ts`. The import:

Before:

```ts
import { GetWebsiteBuilderPageTargetReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageTargetReview/index.js";
```

After:

```ts
import { GetWebsiteBuilderPageTargetReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageTargetReview/index.js";
import { GetWebsiteBuilderPageReviewStepRunUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReviewStepRun/index.js";
```

The envelope:

Before:

```graphql
    type WbPageReviewWithFlagsResponse {
        data: WorkflowsReviewWithFlags
        error: WorkflowsError
    }
```

After:

```graphql
    type WbPageReviewWithFlagsResponse {
        data: WorkflowsReviewWithFlags
        error: WorkflowsError
    }

    type WbPageReviewStepRunResponse {
        data: WorkflowsStepRunInfo
        error: WorkflowsError
    }
```

The query:

Before:

```graphql
        "The active review of a page revision; data is null when it has none."
        getWebsiteBuilderPageTargetReview(revisionId: ID!): WbPageReviewWithFlagsResponse!
```

After:

```graphql
        "The active review of a page revision; data is null when it has none."
        getWebsiteBuilderPageTargetReview(revisionId: ID!): WbPageReviewWithFlagsResponse!
        "The background task of one step attempt; needs workflows editor or reassign (R258). data is null when the task is gone."
        getWebsiteBuilderPageReviewStepRun(
            reviewId: ID!
            stepId: ID!
            taskId: ID!
        ): WbPageReviewStepRunResponse!
```

The resolver, before the target review resolver:

Before:

```ts
        builder.addResolver<GetWebsiteBuilderPageTargetReviewArgs>({
            path: "WbQuery.getWebsiteBuilderPageTargetReview",
```

After:

```ts
        builder.addResolver<GetWebsiteBuilderPageReviewStepRunUseCase.Input>({
            path: "WbQuery.getWebsiteBuilderPageReviewStepRun",
            dependencies: [GetWebsiteBuilderPageReviewStepRunUseCase],
            resolver: (getStepRun: GetWebsiteBuilderPageReviewStepRunUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getStepRun.execute({
                        reviewId: args.reviewId,
                        stepId: args.stepId,
                        taskId: args.taskId
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<GetWebsiteBuilderPageTargetReviewArgs>({
            path: "WbQuery.getWebsiteBuilderPageTargetReview",
```

(Checked in the consistency pass: the `before` blocks are unique in the WB schema factory.)

- [ ] **Step 4: Run the tests to see them pass**

Build the engine package first if Task 4 is not built yet: `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`.

Run each file on its own:
`yarn test packages/api-website-builder-workflows/__tests__/wrappers/getReviewStepRun.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/graphql/pageStepRun.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/graphql/license.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run the same four with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

`CountingEngineCalls.ts` is shared, and the schema factory builds every WB operation, so run the restart tests and a review read test:
`yarn test packages/api-website-builder-workflows/__tests__/wrappers/restartReviewStep.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/graphql/pageRestart.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/target/WbPageTrashAndDelete.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/target/WbPageRevisionDelete.test.ts 2>&1 | tail -50`
and the same five with `yarn test:os`.
Expected: PASS.

Run: `yarn check:test:types -p api-website-builder-workflows --report cli 2>&1 | tail -40`
Expected: no errors. (`legacyPlugins` is `unknown[]` in `createUserContext` and `asGraphQLUser`, so `registerScriptedGetTask` needs no cast.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain of phase 8a (`docs/.bruno/plans/2026-10-16-workflows-phase-8a/00-shared.md`) in full: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/api-website-builder-workflows --no-cache 2>&1 | tail -30`, `git add .`. Restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`); never commit it, `docs/.reports` or `.superpowers`. If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-website-builder-workflows): add the step run query" -m "getWebsiteBuilderPageReviewStepRun returns the status, times, run count, outcome and fixed reason of one step attempt to viewers with editor or reassign and read access to the page." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

## Contract notes

- The contract says "The same tests as Task 5 under the WB package (a CMS review id -> not found)". The plan writes them out in full for the WB fixtures and adds the license and registration lines and the two WB test helpers (`ScriptedGetTask.ts`, the `GetReviewStepRun` counter in `CountingEngineCalls.ts`), as in Task 5. The WB package registers the real background-tasks feature, so its scripted task read replaces the real `GetTaskUseCase` through `legacyPlugins` (the same way `registerFakeGetTask` does for the restart tests).
- The WB tests do not register the fake task service (`registerFakeTaskService`): reading a step run triggers and aborts nothing.
- The guard `action` text, the shared refusal text and the date assertion follow Task 5 (see its Contract notes).
