### Task 5: CMS `getCmsEntryReviewStepRun`

R257, R258, R146, R87, R46, D132, D90, D161; Review Focus 1, 2 (`00-shared.md`). The phase 8a Global Constraints and Rulings R202-R252 apply unchanged (read: R87/D132 wrappers authorize and the shared use case checks nothing, never throw out of a resolver, one class or one public function per file, one named import per line, namespace types, targeted tests, the pre-commit chain).

The CMS wrapper puts Task 4's engine read on the `cms` root of `/graphql`, behind the checks of D132:

- **`GetCmsEntryReviewStepRunUseCase`** (`[CMSA]/features/wrappers/GetCmsEntryReviewStepRun/`: `abstractions.ts`, `GetCmsEntryReviewStepRunUseCase.ts`, `feature.ts`, `index.ts`, the layout of the sibling `RestartCmsEntryReviewStep` folder). Input `GetCmsEntryReviewStepRunInput { reviewId: string; stepId: string; taskId: string }`; dependencies `[CmsEntryReviewGuardService, GetReviewStepRunUseCase]`.
- **Flow** (the order of the restart wrapper):
  1. `guard.authorize({ reviewId, action: "view a step run" })`: a signed-in viewer (`Workflows/NotAuthenticated`), a review of a `cms.*` namespace (another app's review is `Workflows/Review/NotFound`, R46), and read access to the review's target through the CMS's own logic (`Workflows/NotAuthorized` with data `{ action: "view a step run" }`). The guard's own errors pass through.
  2. `canViewStepRunByPermission(viewer)` (Task 4, R258): without `editor` or `reassign` the wrapper fails with `WorkflowsNotAuthorizedError({ action: "view a step run" })` (code `Workflows/NotAuthorized`, message "You are not allowed to view a step run."). The requester is not exempt: a viewer needs the permission, whoever started the review.
  3. `GetReviewStepRunUseCase.execute({ reviewId, stepId, taskId })`. Its `Workflows/Review/StepRunNotFound` (a task id that is not the step's or one of its runs, or an unknown step) and its `null` (the task record is gone) pass through unchanged.
- **GraphQL** (`[CMSA]/graphql/CmsWorkflowsSchemaFactory.ts`): `type CmsEntryReviewStepRunResponse { data: WorkflowsStepRunInfo error: WorkflowsError }`, `CmsQuery.getCmsEntryReviewStepRun(reviewId: ID!, stepId: ID!, taskId: ID!): CmsEntryReviewStepRunResponse!` and its resolver, inline: failed Result -> `new ErrorResponse(result.error)`, otherwise `new Response(result.value)` (a `null` value is `{ data: null, error: null }`). The resolver selects nothing; every field of `WorkflowsStepRunInfo` is selectable (the type of Task 4 carries only the allowed fields, R146).
- **No raw error leaves** (Review Focus 1): the GraphQL test selects every field and asserts the response holds no text of the task's `output.error`, `output.state` or `input`.

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReviewStepRun/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReviewStepRun/GetCmsEntryReviewStepRunUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReviewStepRun/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReviewStepRun/index.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/ScriptedGetTask.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__helpers/CountingEngineCalls.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/wrappers/getReviewStepRun.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/graphql/cmsStepRunSchema.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes: Task 4 (`GetReviewStepRunUseCase` from `@webiny/api-workflows/features/stepRun/GetReviewStepRun/index.js`, `ReviewStepRunInfo` from `@webiny/api-workflows/domain/review/ReviewStepRunInfo.js`, `canViewStepRunByPermission` from `@webiny/api-workflows/domain/review/canViewStepRunByPermission.js`, the `WorkflowsStepRunInfo` GraphQL type); existing (verified with codegraph and the source): `CmsEntryReviewGuardService` (`authorize(params: { reviewId; action }): Promise<Result<{ review: ReviewData; viewer: ReviewViewer }, GuardError>>`, `~/features/wrappers/CmsEntryReviewGuardService/index.js`), `WorkflowsNotAuthorizedError` (`@webiny/api-workflows/domain/permissions/errors.js`), `ErrorResponse`, `Response` (`@webiny/api-graphql`). Test helpers of the package (all existing unless marked new): `createUserContext` (`~tests/__helpers/userContext.js`), `createGraphQLClient` (`~tests/__helpers/graphql.js`), `storeWorkflow` (`~tests/__workflows/workflow.js`), `createAuthorEntry`, `expectOk` (`~tests/__helpers/entries.js`), `requestEntryReview`, `STEP_ID` (`~tests/__helpers/engine.js`), `FAILED_REASON`, `seedFailedAutomationStep` (`~tests/__helpers/seeds.js`), `createWbReview` (`~tests/__helpers/wbReview.js`), `registerTestUsers`, `REQUESTER`, `REVIEWER`, `EDITOR`, `REASSIGNER`, `CMS_READER`, `CMS_WRITER`, `WORKFLOWS_EDITOR`, `WORKFLOWS_REASSIGN`, `folderLevels`, `countEngineCalls`, `engineCalls`, `scriptTargetReads`, `throwOnAccessChecks`, `createExtraModelPlugins`, `registerTestAutomation`, `resetFakeTasks`; new `registerScriptedGetTask`, `putScriptedTask`, `resetScriptedTasks`, `scriptedTaskReads` (`~tests/__helpers/ScriptedGetTask.js`).
- Produces (matches the contract): `GetCmsEntryReviewStepRunUseCase.execute(input: GetCmsEntryReviewStepRunInput): Promise<Result<ReviewStepRunInfo | null, GuardError | WorkflowsNotAuthorizedError | GetReviewStepRunUseCase.Error>>` with the namespace `.Interface`, `.Input`, `.Error`, `.Return`; `GetCmsEntryReviewStepRunInput`; the GraphQL type `CmsEntryReviewStepRunResponse` and query `getCmsEntryReviewStepRun`. Consumed by Task 9 (the CMS gateway document).

**Test runner note:** API package: each test file runs with `yarn test <path>` and then `yarn test:os <path>` (one `test:os` run at a time). Task 4 must be built first (`yarn build -p @webiny/api-workflows --no-cache`) because the wrapper imports its new exports from the package.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-headless-cms-workflows/__tests__/__helpers/ScriptedGetTask.ts` (a task read the step run tests script; the context's default is `NoopGetTask`, which answers `null`):

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

/** Replaces the context's `NoopGetTask` (`legacyPlugins`: function plugins run last, last wins). */
export const registerScriptedGetTask = (container: Container) => {
    container.registerInstance(GetTaskUseCase, new ScriptedGetTask());
};
```

Modify `packages/api-headless-cms-workflows/__tests__/__helpers/CountingEngineCalls.ts`: count the new engine use case, so a refused wrapper call can be shown not to reach it.

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

Create `packages/api-headless-cms-workflows/__tests__/wrappers/getReviewStepRun.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import type { ReviewData, ReviewStepRun } from "@webiny/api-workflows/domain/review/types.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { FAILED_REASON, seedFailedAutomationStep } from "~tests/__helpers/seeds.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { EDITOR, REASSIGNER, REQUESTER, REVIEWER } from "~tests/__helpers/identities.js";
import {
    CMS_READER,
    CMS_WRITER,
    WORKFLOWS_EDITOR,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { scriptTargetReads } from "~tests/__helpers/ScriptedTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import {
    putScriptedTask,
    registerScriptedGetTask,
    resetScriptedTasks,
    scriptedTaskReads
} from "~tests/__helpers/ScriptedGetTask.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import { GetCmsEntryReviewStepRunUseCase } from "~/features/wrappers/GetCmsEntryReviewStepRun/index.js";

const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];
const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...CMS_READER];
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
    [REQUESTER.id]: CMS_WRITER,
    [REVIEWER.id]: CMS_READER
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
 * Admin stores the workflow and REQUESTER asks for three reviews, each with a failed automation
 * step: "Ann" (root; current task `task-old` after the earlier run `task-earlier`), "Locked" in
 * "folder-locked" and "Bob" (current task `task-bob`).
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
    const bobEntry = await createAuthorEntry(admin, { name: "Bob" });
    const seeded = await seedFailedAutomationStep(admin, await requestEntryReview(admin, entry));
    const review = await withTasks(admin, seeded, CURRENT_TASK_ID, [EARLIER_RUN]);
    const lockedSeeded = await seedFailedAutomationStep(
        admin,
        await requestEntryReview(admin, lockedEntry)
    );
    const lockedReview = await withTasks(admin, lockedSeeded, CURRENT_TASK_ID, []);
    const bobSeeded = await seedFailedAutomationStep(admin, await requestEntryReview(admin, bobEntry));
    const bobReview = await withTasks(admin, bobSeeded, "task-bob", []);
    return { review, lockedReview, bobReview };
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
            ...createExtraModelPlugins(),
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
        .resolve(GetCmsEntryReviewStepRunUseCase)
        .execute({ reviewId, stepId: STEP_ID, taskId });
};

describe("CMS step run wrapper (R257, R258)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        resetFakeTasks();
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
        const requester = await asUser(REQUESTER, CMS_WRITER);
        engineCalls.length = 0;

        const refusedRequester = await readStepRun(requester, review.id, CURRENT_TASK_ID);
        const reviewer = await asUser(REVIEWER, CMS_READER);
        const refusedReviewer = await readStepRun(reviewer, review.id, CURRENT_TASK_ID);

        expect(refusedRequester.error?.code).toBe("Workflows/NotAuthorized");
        expect(refusedRequester.error?.data).toEqual(ACTION);
        expect(refusedRequester.error?.message).toBe("You are not allowed to view a step run.");
        expect(refusedReviewer.error?.code).toBe("Workflows/NotAuthorized");
        expect(engineCalls).toEqual(["GetReview", "GetReview"]);
        expect(scriptedTaskReads.ids).toEqual([]);
    });

    it("refuses an editor without read access to the target, before the engine and the task", async () => {
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

    it("reports a Website Builder review as not found (R46)", async () => {
        const wbReview = await createWbReview();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, wbReview.id, CURRENT_TASK_ID);

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
        putScriptedTask("task-bob");
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await readStepRun(editor, review.id, "task-bob");

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

Create `packages/api-headless-cms-workflows/__tests__/graphql/cmsStepRunSchema.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { FAILED_REASON, seedFailedAutomationStep } from "~tests/__helpers/seeds.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { EDITOR, REQUESTER } from "~tests/__helpers/identities.js";
import { CMS_READER, CMS_WRITER, WORKFLOWS_EDITOR } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { createGraphQLClient, type GraphQLClient } from "~tests/__helpers/graphql.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import {
    putScriptedTask,
    registerScriptedGetTask,
    resetScriptedTasks,
    scriptedTaskReads
} from "~tests/__helpers/ScriptedGetTask.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";

const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: CMS_WRITER
};
const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];
const TASK_ID = "task-old";

const GET_STEP_RUN = /* GraphQL */ `
    query GetStepRun($reviewId: ID!, $stepId: ID!, $taskId: ID!) {
        cms {
            getCmsEntryReviewStepRun(reviewId: $reviewId, stepId: $stepId, taskId: $taskId) {
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

/** A `/graphql` client as the identity, with the scripted task read and the engine call counter. */
const clientFor = (identity: IdentityData | null, permissions: SecurityPermission[]) => {
    return createGraphQLClient({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [
            ...createExtraModelPlugins(),
            registerTestUsers,
            registerScriptedGetTask,
            countEngineCalls
        ]
    });
};

/** Runs an operation and returns `data.cms`; a GraphQL-level error fails the test. */
const run = async (client: GraphQLClient, variables: Record<string, unknown>) => {
    const body = await client(GET_STEP_RUN, variables);
    expect(body.errors).toBeUndefined();
    return body.data.cms.getCmsEntryReviewStepRun;
};

/** Admin stores the workflow and REQUESTER asks for a review of "Ann"; its step failed as `task-old`. */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const seeded = await seedFailedAutomationStep(admin, await requestEntryReview(admin, entry));
    const steps = seeded.steps.map(step => ({ ...step, taskId: TASK_ID, runs: [] }));
    const review = expectOk(
        await admin.container.resolve(ReviewRepository).save({ ...seeded, steps })
    );
    return { review };
};

describe("CMS step run GraphQL (R257, R258)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        resetFakeTasks();
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
        const editor = clientFor(EDITOR, EDITOR_PERMISSIONS);

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
        const requester = clientFor(REQUESTER, CMS_WRITER);

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
        const editor = clientFor(EDITOR, EDITOR_PERMISSIONS);

        const result = await run(editor, { reviewId: review.id, stepId: STEP_ID, taskId: TASK_ID });

        expect(result).toEqual({ data: null, error: null });
    });

    it("returns StepRunNotFound with its data for a task id that is not on the step", async () => {
        const { review } = await createScenario();
        putScriptedTask("task-unknown");
        const editor = clientFor(EDITOR, EDITOR_PERMISSIONS);

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

    it("reports a Website Builder review as not found (R46)", async () => {
        const wbReview = await createWbReview();
        const editor = clientFor(EDITOR, EDITOR_PERMISSIONS);

        const result = await run(editor, {
            reviewId: wbReview.id,
            stepId: STEP_ID,
            taskId: TASK_ID
        });

        expect(result.data).toBeNull();
        expect(result.error).toMatchObject({
            code: "Workflows/Review/NotFound",
            data: { id: wbReview.id }
        });
        expect(engineCalls).not.toContain("GetReviewStepRun");
    });

    it("refuses an anonymous identity", async () => {
        const { review } = await createScenario();
        const anonymous = clientFor(null, []);

        const result = await run(anonymous, {
            reviewId: review.id,
            stepId: STEP_ID,
            taskId: TASK_ID
        });

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
    });
});
```

Modify `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts` (the operation is added with the license and not without it).

Before:

```ts
    "getCmsEntryTargetReview",
    "listCmsEntryReviews",
    "listCmsEntryWorkflowModels",
```

After:

```ts
    "getCmsEntryTargetReview",
    "getCmsEntryReviewStepRun",
    "listCmsEntryReviews",
    "listCmsEntryWorkflowModels",
```

Modify `packages/api-headless-cms-workflows/__tests__/registration.test.ts` (the wrapper is registered once with the license and not without it).

Before:

```ts
import { GetCmsEntryTargetReviewUseCase } from "~/features/wrappers/GetCmsEntryTargetReview/index.js";
```

After:

```ts
import { GetCmsEntryTargetReviewUseCase } from "~/features/wrappers/GetCmsEntryTargetReview/index.js";
import { GetCmsEntryReviewStepRunUseCase } from "~/features/wrappers/GetCmsEntryReviewStepRun/index.js";
```

Before:

```ts
    GetCmsEntryTargetReviewUseCase,
    ListCmsEntryReviewsUseCase,
```

After:

```ts
    GetCmsEntryTargetReviewUseCase,
    GetCmsEntryReviewStepRunUseCase,
    ListCmsEntryReviewsUseCase,
```

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-headless-cms-workflows/__tests__/wrappers/getReviewStepRun.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsStepRunSchema.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. The wrapper test and the registration test fail to load `~/features/wrappers/GetCmsEntryReviewStepRun/index.js`; the GraphQL test fails with a GraphQL validation error (`Cannot query field "getCmsEntryReviewStepRun" on type "CmsQuery"`); the license test fails on the missing query name.

- [ ] **Step 3: Implement**

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReviewStepRun/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewStepRunInfo } from "@webiny/api-workflows/domain/review/ReviewStepRunInfo.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { GetReviewStepRunUseCase } from "@webiny/api-workflows/features/stepRun/GetReviewStepRun/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface GetCmsEntryReviewStepRunInput {
    reviewId: string;
    stepId: string;
    /** The step's current task id or the task id of one of its earlier runs. */
    taskId: string;
}

export interface IGetCmsEntryReviewStepRunUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    stepRun: GetReviewStepRunUseCase.Error;
}

type UseCaseError =
    IGetCmsEntryReviewStepRunUseCaseErrors[keyof IGetCmsEntryReviewStepRunUseCaseErrors];

export interface IGetCmsEntryReviewStepRunUseCase {
    execute(
        input: GetCmsEntryReviewStepRunInput
    ): Promise<Result<ReviewStepRunInfo | null, UseCaseError>>;
}

/**
 * The background task of one attempt of a CMS review step, as workflows shows it (R257, R258,
 * D90, D161): read access to the target and `editor` or `reassign` here, the step and task checks
 * in the engine. `null` means the task record is gone.
 */
export const GetCmsEntryReviewStepRunUseCase = createAbstraction<IGetCmsEntryReviewStepRunUseCase>(
    "GetCmsEntryReviewStepRunUseCase"
);

export namespace GetCmsEntryReviewStepRunUseCase {
    export type Interface = IGetCmsEntryReviewStepRunUseCase;
    export type Input = GetCmsEntryReviewStepRunInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewStepRunInfo | null, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReviewStepRun/GetCmsEntryReviewStepRunUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { GetReviewStepRunUseCase } from "@webiny/api-workflows/features/stepRun/GetReviewStepRun/index.js";
import { canViewStepRunByPermission } from "@webiny/api-workflows/domain/review/canViewStepRunByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { GetCmsEntryReviewStepRunUseCase as UseCase } from "./abstractions.js";

const ACTION = "view a step run";

class GetCmsEntryReviewStepRunUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
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

export const GetCmsEntryReviewStepRunUseCase = UseCase.createImplementation({
    implementation: GetCmsEntryReviewStepRunUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, GetReviewStepRunUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReviewStepRun/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetCmsEntryReviewStepRunUseCase } from "./GetCmsEntryReviewStepRunUseCase.js";

export const GetCmsEntryReviewStepRunFeature = createFeature({
    name: "CmsWorkflows/GetCmsEntryReviewStepRun",
    register(container) {
        container.register(GetCmsEntryReviewStepRunUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReviewStepRun/index.ts`:

```ts
export { GetCmsEntryReviewStepRunUseCase } from "./abstractions.js";
export type { GetCmsEntryReviewStepRunInput } from "./abstractions.js";
```

Modify `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`.

Before:

```ts
import { GetCmsEntryTargetReviewFeature } from "./GetCmsEntryTargetReview/feature.js";
```

After:

```ts
import { GetCmsEntryTargetReviewFeature } from "./GetCmsEntryTargetReview/feature.js";
import { GetCmsEntryReviewStepRunFeature } from "./GetCmsEntryReviewStepRun/feature.js";
```

Before:

```ts
        GetCmsEntryTargetReviewFeature.register(container);
        ListCmsEntryReviewsFeature.register(container);
```

After:

```ts
        GetCmsEntryTargetReviewFeature.register(container);
        GetCmsEntryReviewStepRunFeature.register(container);
        ListCmsEntryReviewsFeature.register(container);
```

Modify `packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts`. The import:

Before:

```ts
import { GetCmsEntryTargetReviewUseCase } from "~/features/wrappers/GetCmsEntryTargetReview/index.js";
```

After:

```ts
import { GetCmsEntryTargetReviewUseCase } from "~/features/wrappers/GetCmsEntryTargetReview/index.js";
import { GetCmsEntryReviewStepRunUseCase } from "~/features/wrappers/GetCmsEntryReviewStepRun/index.js";
```

The envelope:

Before:

```graphql
    type CmsEntryReviewWithFlagsResponse {
        data: WorkflowsReviewWithFlags
        error: WorkflowsError
    }
```

After:

```graphql
    type CmsEntryReviewWithFlagsResponse {
        data: WorkflowsReviewWithFlags
        error: WorkflowsError
    }

    type CmsEntryReviewStepRunResponse {
        data: WorkflowsStepRunInfo
        error: WorkflowsError
    }
```

The query:

Before:

```graphql
        getCmsEntryTargetReview(modelId: ID!, revisionId: ID!): CmsEntryReviewWithFlagsResponse!
```

After:

```graphql
        getCmsEntryTargetReview(modelId: ID!, revisionId: ID!): CmsEntryReviewWithFlagsResponse!
        "The background task of one step attempt; needs workflows editor or reassign (R258). data is null when the task is gone."
        getCmsEntryReviewStepRun(
            reviewId: ID!
            stepId: ID!
            taskId: ID!
        ): CmsEntryReviewStepRunResponse!
```

The resolver, before the target review resolver:

Before:

```ts
        builder.addResolver<GetCmsEntryTargetReviewArgs>({
            path: "CmsQuery.getCmsEntryTargetReview",
```

After:

```ts
        builder.addResolver<GetCmsEntryReviewStepRunUseCase.Input>({
            path: "CmsQuery.getCmsEntryReviewStepRun",
            dependencies: [GetCmsEntryReviewStepRunUseCase],
            resolver: (getStepRun: GetCmsEntryReviewStepRunUseCase.Interface) => {
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

        builder.addResolver<GetCmsEntryTargetReviewArgs>({
            path: "CmsQuery.getCmsEntryTargetReview",
```

(Checked in the consistency pass: the four `before` blocks are unique in their files, and Task 7's later hunks on the same files anchor on other lines; `CmsEntryReviewWithFlagsResponse` is used by two queries but its type definition block appears once.)

- [ ] **Step 4: Run the tests to see them pass**

Build the engine package first if Task 4 is not built yet: `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`.

Run each file on its own:
`yarn test packages/api-headless-cms-workflows/__tests__/wrappers/getReviewStepRun.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsStepRunSchema.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchemaLicense.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run the same four with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

`CountingEngineCalls.ts` is shared, and the schema factory builds every CMS operation, so run the restart tests and the main schema test:
`yarn test packages/api-headless-cms-workflows/__tests__/wrappers/restartReviewStep.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsRestartSchema.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50`
and the same three with `yarn test:os`.
Expected: PASS.

Run: `yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40`
Expected: no errors. (If the `legacyPlugins` list rejects `registerScriptedGetTask`, it is typed `unknown[]` in `createUserContext` and `createGraphQLClient`, so no cast is needed. If `GetCmsEntryReviewStepRunUseCase.Return` does not accept the engine's `Result` because of the error union, widen `IGetCmsEntryReviewStepRunUseCaseErrors` with the missing member, the wrapper's own union must be a superset of the guard, the permission and the engine errors.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain of phase 8a (`docs/.bruno/plans/2026-10-16-workflows-phase-8a/00-shared.md`) in full: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/api-headless-cms-workflows --no-cache 2>&1 | tail -30`, `git add .`. Restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`); never commit it, `docs/.reports` or `.superpowers`. If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-headless-cms-workflows): add the step run query" -m "getCmsEntryReviewStepRun returns the status, times, run count, outcome and fixed reason of one step attempt to viewers with editor or reassign and read access to the entry." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

## Contract notes

- The contract lists the CMS tests as "a wrapper test under `__tests__/wrappers/` and a GraphQL test under `__tests__/graphql/` selecting every field". The plan also adds the license test line and the registration test lines (existing tests that enumerate every CMS operation and wrapper), plus the test helpers `ScriptedGetTask.ts` (a scripted `GetTaskUseCase`, because the context's `NoopGetTask` answers `null` and the package's `FakeGetTask` knows only tasks the fake task service triggered) and the engine call counter for `GetReviewStepRun` in `CountingEngineCalls.ts`.
- R258 says the wrappers "authorize the review read through their guard ... then require `canViewStepRunByPermission`". The guard's `action` text is `view a step run`, which is also the text of the permission refusal, so both refusals read "You are not allowed to view a step run." with data `{ action: "view a step run" }`. The contract names no action string; this one follows the sibling wrappers ("restart a review step", "view this review").
- The GraphQL date check compares `new Date(value).toISOString()` instead of the raw string, because the shared `DateTime` scalar (`api-graphql/src/builtInTypes/DateTimeScalar.ts`) always serializes through `new Date(value).toISOString()`; a stored ISO string with milliseconds would also pass a plain string comparison, but the normalised comparison does not depend on that.
