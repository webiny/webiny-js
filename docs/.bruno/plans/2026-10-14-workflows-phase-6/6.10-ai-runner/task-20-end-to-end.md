### Task 20: end-to-end test

Spec 7.3, 7.4, 9.3; D7, D27, D36, D55, D62, D134; R150, R161, R168, R170, R171, R173, R175, R177, R178; A56, A57, A59; Review Focus 1 (stale AI result after cancel or restart), Review Focus 4 (the write identity, the bypass only around the write; move and delete stay blocked) and the acceptance of the whole phase. One test file drives a CMS review with an `ai` step through the real stack: `WorkflowsFeature`, `CmsWorkflowsFeature`, the real `Extension.ts` of ai-powerups (so the combined gate, the capability, `ConfiguredAiModelsService`, `AiStepType` and `AiStepRunner` are the production registrations), the real `WorkflowStepRunTaskHandler`, the real tool registry with the built-in tools `readTarget` and `updateTargetFields`, and the real CMS editor and CMS entry update path. Only three things are fake, because a test never calls a model or a background-task runner: `Ai` (the `ScriptedAi` of Task 19, which runs the real tools like the AI SDK loop does), the AI settings (a connection preset with a stored key; the stub `Encryption` decrypts it) and `TaskService` plus the task controller (the phase 5 helpers, copied).

- **The handler is driven directly**, the way a task runner would: `handler.run({ input, controller, definition })` inside `IdentityContext.withoutAuthorization` (what `TaskManager` does, R161) with a fake controller whose `createdBy` is the requester. The review is requested through the engine (`RequestReviewUseCase`), which reaches the `ai` step: `AiStepType.reach` resolves the capability, `StepRunReachService` triggers the (fake) task as the requester and saves the step `inReview` under that task id. The test then runs the handler for that task id.
- **Scenarios:** approve; reject with issues (stored on the step, the entry untouched); read then edit then approve (the edit lands on the reviewed revision through the real CMS update path, the bypass is closed afterwards, the approved revision stays locked); **the write identity** (the handler runs with an ambient identity that is not the requester; the updated revision's `savedBy` and `modifiedBy` are the requester and the probe saw the requester inside the bypass, R161; Review Focus 4); trash, permanent delete and move refused with their exact error codes while the update is in flight and allowed to succeed (a decorator on `UpdateEntryUseCase` tries them from inside the tool's bypass window only; the entry stays in its folder and out of the bin; Review Focus 4); an allowlist that holds end to end (a step with only `readTarget`, a model that calls `updateTargetFields` anyway: not available, entry untouched); a bad value (`bio: 42`: the tool answers not ok, the entry is untouched, the bypass is closed); model gone (the connection removed after the request: the step fails with the fixed model text, no model call, no raw error logged) and **restart after failure** (the connection restored, `RestartReviewStepUseCase`, a new task, the run approves; the failed attempt is in `runs`); capability disabled; tool unregistered; input too large (a `bio` sized from `AI_STEP_MAX_INPUT_CHARACTERS`: the fixed too-large text, no model call, entry untouched); timeout (the task's remaining runtime is nearly gone: the signal fires at once, the fixed timeout text, no model call); a re-entered task (`iteration` 2 fails with `The AI review failed.`, no model call); **stale after cancel** and **stale after restart** (the stored review is flipped by the scripted model during the call, with fake `Date` advanced by `STEP_RUN_STALE_CHECK_INTERVAL_MS` so the 5-second throttle cannot make the test flaky; the next tool call writes nothing, the run ends with nothing written, the entry is unchanged, the stored review is exactly what the cancel or the restart left); and the registrations (`ai` in `StepType` and `StepRunner`, `listStepTypes` reads the `ai` row from the registry, R166). The flag-off matrix (no `ai` type or runner with either flag off) and the later-step cases (an `ai` step after another step, previous comments in the prompt) stay unit-level: Task 19's `WorkflowReviewRegistration.test.ts` and `AiStepRunner.test.ts` pin them, this file does not repeat them.
- **`packages/ai-powerups/ci.config.json`** mirrors `packages/api-workflows/ci.config.json` (`vitest.storageOps`: `["ddb", "ddb-os,ddb"]`) so the e2e runs on both storages. It applies to the whole package, so this task runs `yarn test` then `yarn test:os`, one at a time (parallel `test:os` runs clash on port 8001), on the e2e file, and then runs every existing ai-powerups test file once under `yarn test:os` by path, fixing or reporting any failure (the ai-powerups tests have so far run under `yarn test` only).
- **Package-local copies, listed among the package's test files** (no import of another package's `__tests__`; copying these test helpers is the accepted precedent, as api-headless-cms-workflows does): the model and group plugins, the fake task service and controller, the fake ACO folder abstractions, the logger capture, the `createAiStepContext` handler helper (the `createContextHandler` equivalent of api-workflows and api-headless-cms-workflows, with the production `Extension` registered) and the two decorators the tests need (`ProbeUpdateEntry`, `HiddenAiToolRegistry`).
- **devDependencies** (`packages/ai-powerups/package.json`): `@webiny/api-headless-cms-workflows` and `@webiny/api-headless-cms-testing` (Global Constraints) and, needed by the same test stand-ins, `@webiny/api-aco` (the CMS adapter reads two ACO folder abstractions and the folder-level-permission abstraction through its own dependencies, so the e2e registers stand-ins, as api-headless-cms-workflows does; test-only, never a dependency of the package, and the app-package rule for `@webiny/api-aco` is about production dependencies of the workflows packages). R177 stays true: no workflows package depends on `@webiny/ai-powerups`; Step 3 checks it.

**Files:**
- Modify: `packages/ai-powerups/package.json` (three devDependencies)
- Modify (generated by `node scripts/generateTsConfigsInPackages.js`, Step 3): `packages/ai-powerups/tsconfig.json`, `packages/ai-powerups/tsconfig.build.json`, `yarn.lock`
- Create: `packages/ai-powerups/ci.config.json`
- Create: `packages/ai-powerups/__tests__/__helpers/AuthorModel.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/AuthorEntries.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/FakeTaskService.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/FakeTaskController.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/FakeFolders.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/CapturingLogger.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/ProbeUpdateEntry.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/HiddenAiToolRegistry.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/createAiStepContext.ts`
- Create: `packages/ai-powerups/__tests__/features/WorkflowReview/AiStep.e2e.test.ts`

**Interfaces:**
- Consumes:
  - Task 19: `ScriptedAi`, `APPROVE_DECISION`, `ScriptedStep` (`~tests/__helpers/ScriptedAi.js`), `AI_STEP_ID`, `AI_MODEL` (Task 17's `~tests/__helpers/aiStepFixtures.js`; Task 19 adds no second review helper), `AiStepRunnerFeature` and `AiStepRunner` through `Extension.ts` (the combined gate).
  - Task 15: `createAiPowerUpsSettings`, `createConnectionPreset`, `registerFakeAiPowerUpsSettings` (`~tests/__helpers/FakeAiPowerUpsSettings.js`), `createAiModel` (`~tests/__helpers/FakeAi.js`).
  - Task 17: `AiStepType` (registered by `Extension.ts`; `validate`, `checkConfig`, `reach`), `aiStepConfigSchema` (the step config `{ instructions, model, tools }`).
  - Task 16: `WORKFLOWS_REVIEW_CAPABILITY_ID`, `WorkflowsReviewCapability` (registered by `Extension.ts`).
  - Tasks 1-13 (api-workflows, api-headless-cms-workflows), by public path: `WorkflowsFeature` (`@webiny/api-workflows`), `CmsWorkflowsFeature` (`@webiny/api-headless-cms-workflows`), `StoreWorkflowUseCase` (`features/workflow/StoreWorkflow/index.js`), `RequestReviewUseCase` (`features/review/RequestReview/index.js`), `CancelReviewUseCase`, `RestartReviewStepUseCase` (`features/review/CancelReview/index.js`, `features/review/RestartReviewStep/index.js`), `ReviewRepository` (`domain/review/abstractions/ReviewRepository.js`), `ReviewSaver` (`features/review/ReviewSaver/abstractions.js`), `Review` (`domain/review/Review.js`), `WorkflowStepRunTaskHandler` (`features/stepRun/WorkflowStepRunTask/index.js`), `StepRunTaskInput` (`features/stepRun/types.js`), `STEP_RUN_STALE_CHECK_INTERVAL_MS` (`features/stepRun/constants.js`), `StepType` (`features/stepTypes/StepType/index.js`), `StepRunner` (`features/stepRun/StepRunner/index.js`), `WorkflowAiToolRegistryService` (`features/aiTools/WorkflowAiToolRegistryService/index.js`), `ListWorkflowStepTypesUseCase` (`features/config/ListWorkflowStepTypes/index.js`), `WorkflowBypassService` (`features/bypass/WorkflowBypassService/index.js`), `READ_TARGET_TOOL_NAME`, `UPDATE_TARGET_FIELDS_TOOL_NAME`, `AI_TOOL_STEP_NOT_RUNNING_MESSAGE`, `AI_STEP_CONTENT_TOO_LARGE_MESSAGE` (`features/aiTools/constants.js`), `ReviewTargetContent` (`features/review/ReviewTargetEditor/index.js`), `Actor`, `ReviewData` (`domain/review/types.js`). The CMS editor (Tasks 11 and 12) answers `readTarget` and `updateTargetFields` for `cms.author`.
  - Existing: `createCmsTestHandler` (`@webiny/api-headless-cms-testing`), `GetTaskUseCase` (`@webiny/background-tasks/api/features/GetTask/index.js`), `TaskService`, `TaskDataStatus` (`@webiny/api-core/features/task/TaskService/index.js`), `TaskDefinition`, `TaskResultStatus`, `ITaskOutput` (`@webiny/api-core/features/task/TaskDefinition/index.js`), `TaskController` (`@webiny/api-core/features/task/TaskController/index.js`), `IdentityContext`, `AuthenticatedIdentity` (`@webiny/api-core/features/security/IdentityContext/index.js`; `withoutAuthorization`, `withIdentity`), `Logger`, `Ai`, `Encryption`, `createTestWcpLicense` (`@webiny/wcp/testing/createTestWcpLicense.js`), `PROJECT_PACKAGE_FEATURE_NAME` (`@webiny/wcp/types.js`), CMS use cases `CreateEntryUseCase`, `UpdateEntryUseCase`, `DeleteEntryUseCase`, `MoveEntryUseCase`, `GetRevisionByIdUseCase`, `GetModelUseCase` (`@webiny/api-headless-cms/features/contentEntry/*` and `.../contentModel/GetModel/index.js`), `createModelPlugin`, `createModelGroupPlugin` (`@webiny/api-headless-cms`), `NoopFolderLevelPermissions` (`@webiny/api-aco/features/flp/FolderLevelPermissions/index.js`), `GetFolderRepository`, `GetAncestorsUseCase`, `FolderNotFoundError`, `Folder` (`@webiny/api-aco/...`).
- Produces: the acceptance test of the phase and the package-local test helpers above (`createAiStepContext`, `createAuthorEntry`, `readEntry`, `expectOk`, `triggeredTasks`, `abortedTasks`, `resetFakeTasks`, `createFakeTaskController`, `captureLoggedErrors`, `loggedErrors`, `bypassProbe`, `hiddenAiTools`). `packages/ai-powerups/ci.config.json`.

- [ ] **Step 1: Write the failing tests**

Create `packages/ai-powerups/ci.config.json` first (it makes `yarn test:os` meaningful for the package):

```json
{
  "$schema": "../../.github/workflows/ci.config.schema.json",
  "vitest": {
    "storageOps": ["ddb", "ddb-os,ddb"]
  }
}
```

Create `packages/ai-powerups/__tests__/__helpers/AuthorModel.ts` (the "author" model of the api-headless-cms-workflows tests with a second, long-text field the AI may edit):

```ts
import { createModelGroupPlugin, createModelPlugin } from "@webiny/api-headless-cms";

export const group = {
    id: "default",
    name: "Default",
    description: "",
    slug: "default",
    icon: {
        name: "fa/fas",
        type: "fa/fas"
    }
};

export const model = {
    modelId: "author",
    name: "Author",
    group: group.slug,
    titleFieldId: "name",
    description: "",
    icon: null,
    singularApiName: "Author",
    pluralApiName: "Authors",
    layout: [["name"], ["bio"]],
    fields: [
        {
            id: "name",
            storageId: "text@name",
            fieldId: "name",
            type: "text",
            label: "Name",
            validation: [],
            listValidation: []
        },
        {
            id: "bio",
            storageId: "long-text@bio",
            fieldId: "bio",
            type: "long-text",
            label: "Bio",
            validation: [],
            listValidation: []
        }
    ]
};

/** The review namespace of the author model. */
export const AUTHOR_NAMESPACE = `cms.${model.modelId}`;

export const createModelPlugins = () => {
    return [createModelPlugin(model), createModelGroupPlugin(group)];
};
```

Create `packages/ai-powerups/__tests__/__helpers/AuthorEntries.ts`:

```ts
import type { Result } from "@webiny/feature/api";
import type { CmsContext, CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { model } from "./AuthorModel.js";

/** Returns the value of an ok result; throws the error otherwise, so a setup fails at its cause. */
export const expectOk = <TValue, TError>(result: Result<TValue, TError>): TValue => {
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

export interface CodedError {
    code?: string;
}

/** The `code` of the error of a failed result, `null` for an ok result or an error without one. */
export const getErrorCode = <TValue>(result: Result<TValue, unknown>): string | null => {
    if (result.isOk()) {
        return null;
    }
    return (result.error as CodedError).code ?? null;
};

export const getAuthorModel = async (context: CmsContext): Promise<CmsModel> => {
    return expectOk(await context.container.resolve(GetModelUseCase).execute(model.modelId));
};

export interface AuthorEntryParams {
    name: string;
    bio: string;
}

/** Creates an "author" entry in the root folder as the context's identity. */
export const createAuthorEntry = async (
    context: CmsContext,
    params: AuthorEntryParams
): Promise<CmsEntry> => {
    const authorModel = await getAuthorModel(context);
    return expectOk(
        await context.container.resolve(CreateEntryUseCase).execute(authorModel, {
            values: { name: params.name, bio: params.bio },
            location: { folderId: "root" }
        })
    );
};

/** The stored revision, read without access checks. */
export const readEntry = async (context: CmsContext, revisionId: string): Promise<CmsEntry> => {
    const authorModel = await getAuthorModel(context);
    return expectOk(
        await context.container.resolve(GetRevisionByIdUseCase).execute(authorModel, revisionId)
    );
};
```

Create `packages/ai-powerups/__tests__/__helpers/FakeTaskService.ts` (the api-workflows helper without the fault switches, copied: the saver, the reach and the abort service call `TaskService`, and the test containers have no background-tasks feature):

```ts
import { Result } from "@webiny/feature/api";
import {
    AuthenticatedIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TaskDataStatus, TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

export interface TriggeredTask {
    id: string;
    definition: string;
    name: string | undefined;
    input: TaskService.TaskInput | undefined;
    /** The identity in force when `trigger` was called (R149). */
    identityId: string;
    identityType: string;
}

export interface AbortedTask {
    id: string;
    message: string | undefined;
}

/** Every `trigger` call, in order. Clear it with `resetFakeTasks()` in `beforeEach`. */
export const triggeredTasks: TriggeredTask[] = [];
/** Every `abort` call, in order. */
export const abortedTasks: AbortedTask[] = [];

let nextTaskNumber = 1;

export const resetFakeTasks = (): void => {
    triggeredTasks.length = 0;
    abortedTasks.length = 0;
    nextTaskNumber = 1;
};

const NOW = "2026-10-14T10:00:00.000Z";

// `TaskService.trigger` and `abort` are generic over the task input and output; the fake returns a
// plain task, so the Results are cast with `as never` (a test helper, never production code).
class FakeTaskServiceImpl implements TaskService.Interface {
    public constructor(private identityContext: IdentityContext.Interface) {}

    public async trigger(params: Parameters<TaskService.Interface["trigger"]>[0]) {
        const identity = this.identityContext.getIdentity();
        const id = `task-${nextTaskNumber++}`;
        triggeredTasks.push({
            id,
            definition: params.definition,
            name: params.name,
            input: params.input,
            identityId: identity.id,
            identityType: identity.type
        });
        return Result.ok({
            id,
            name: params.name ?? "",
            definitionId: params.definition,
            executionName: "",
            input: params.input ?? {},
            iterations: 0,
            taskStatus: TaskDataStatus.PENDING,
            eventResponse: undefined,
            createdOn: NOW,
            savedOn: NOW,
            createdBy: { id: identity.id, displayName: identity.displayName, type: identity.type }
        }) as never;
    }

    public async abort(params: Parameters<TaskService.Interface["abort"]>[0]) {
        abortedTasks.push({ id: params.id, message: params.message });
        return Result.ok({
            id: params.id,
            name: "",
            definitionId: "",
            executionName: "",
            input: {},
            iterations: 0,
            taskStatus: TaskDataStatus.ABORTED,
            eventResponse: undefined,
            createdOn: NOW,
            savedOn: NOW,
            createdBy: { id: "", displayName: "", type: "" }
        }) as never;
    }

    public async fetchServiceInfo() {
        return Result.ok({}) as never;
    }
}

export const FakeTaskService = TaskService.createImplementation({
    implementation: FakeTaskServiceImpl,
    dependencies: [IdentityContext]
});
```

Create `packages/ai-powerups/__tests__/__helpers/FakeTaskController.ts` (the api-workflows helper, copied, with the optional `remainingMilliseconds` Task 4 added):

```ts
import "@webiny/background-tasks/api/features/TaskController/augmentation.js";
import {
    type ITaskOutput,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import type { StepRunTaskInput } from "@webiny/api-workflows/features/stepRun/types.js";

const NOW = "2026-10-14T10:00:00.000Z";

export interface FakeTaskControllerParams {
    taskId: string;
    /** The id of the identity that created the task: the requester (R149). */
    createdById: string;
    input: StepRunTaskInput;
    /** `iterations` of the task; 1 on the first run. */
    iterations?: number;
    /** What a previous iteration wrote with `updateOutput`. */
    output?: ITaskOutput;
    /** The task's remaining runtime; 900000 by default. */
    remainingMilliseconds?: number;
}

/**
 * A `TaskController` for driving a task handler directly: `response` builds the same result
 * objects as the runner's, `state` is backed by plain variables and `outputUpdates` records every
 * `updateOutput` call.
 */
export const createFakeTaskController = (params: FakeTaskControllerParams) => {
    const task: TaskService.Task<StepRunTaskInput> = {
        id: params.taskId,
        name: "Workflow step: AI review",
        definitionId: "workflowsStepRun",
        executionName: "",
        input: params.input,
        iterations: params.iterations ?? 1,
        taskStatus: TaskDataStatus.RUNNING,
        eventResponse: undefined,
        createdOn: NOW,
        savedOn: NOW,
        createdBy: { id: params.createdById, displayName: "John Doe", type: "admin" }
    };
    let output: ITaskOutput | undefined = params.output;
    const outputUpdates: ITaskOutput[] = [];
    const remaining = params.remainingMilliseconds ?? 900000;

    const controller = {
        response: {
            done: (message?: string, doneOutput?: ITaskOutput) => ({
                status: TaskResultStatus.DONE,
                message,
                output: doneOutput
            }),
            continue: (input: StepRunTaskInput, options?: { seconds: number }) => ({
                status: TaskResultStatus.CONTINUE,
                input,
                wait: options && options.seconds >= 1 ? options.seconds : undefined
            }),
            error: (error: Error | string) => ({
                status: TaskResultStatus.ERROR,
                error: { message: typeof error === "string" ? error : error.message }
            }),
            aborted: () => ({ status: TaskResultStatus.ABORTED })
        },
        state: {
            getTask: () => task,
            getStatus: () => task.taskStatus,
            getInput: () => task.input,
            getOutput: () => output,
            updateInput: async () => undefined,
            updateOutput: async (values: ITaskOutput) => {
                outputUpdates.push(structuredClone(values));
                output = { ...output, ...values };
            }
        },
        logger: {
            info: async () => undefined,
            error: async () => undefined
        },
        task: {
            trigger: async () => {
                throw new Error("The step run handler never triggers child tasks.");
            },
            listChildren: async () => []
        },
        runtime: {
            isCloseToTimeout: () => false,
            isAborted: () => false,
            getRemainingSeconds: () => Math.floor(remaining / 1000),
            getRemainingMilliseconds: () => remaining
        }
    };

    return {
        controller: controller as unknown as TaskController.Interface<StepRunTaskInput>,
        task,
        outputUpdates
    };
};
```

Create `packages/ai-powerups/__tests__/__helpers/FakeFolders.ts` (stand-ins for the two ACO folder abstractions the CMS adapter reads; every entry of the e2e is in the root folder, which ACO does not store; a copy of the api-headless-cms-workflows test helper, accepted as test-helper precedent):

```ts
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { GetAncestorsUseCase } from "@webiny/api-aco/features/folder/GetAncestors/abstractions.js";
import type { Folder } from "@webiny/api-aco/folder/folder.types.js";
import { FolderNotFoundError } from "@webiny/api-aco/domain/folder/errors.js";

class FakeGetFolderRepository implements GetFolderRepository.Interface {
    public async execute(id: string): Promise<Result<Folder, GetFolderRepository.Error>> {
        return Result.fail(new FolderNotFoundError(id));
    }
}

class FakeGetAncestors implements GetAncestorsUseCase.Interface {
    public async execute(): Promise<Result<Folder[], GetAncestorsUseCase.Error>> {
        return Result.ok([]);
    }
}

/** ACO is not part of the harness: the CMS folder port reads these two stand-ins. */
export const registerFakeFolders = (container: Container) => {
    container.registerInstance(GetFolderRepository, new FakeGetFolderRepository());
    container.registerInstance(GetAncestorsUseCase, new FakeGetAncestors());
};
```

Create `packages/ai-powerups/__tests__/__helpers/CapturingLogger.ts` (errors and infos are captured instead of printed):

```ts
import type { Container } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";

export interface LoggedError {
    message: string;
    fields: Record<string, unknown>;
}

/** Errors logged through `Logger` while `captureLoggedErrors` is registered. Clear it per test. */
export const loggedErrors: LoggedError[] = [];

/** Info messages logged while `captureLoggedErrors` is registered. Clear it per test. */
export const loggedInfos: string[] = [];

class CapturingLogger implements Logger.Interface {
    public constructor(private decoratee: Logger.Interface) {}

    public trace(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.trace(objOrMsg, ...args);
    }
    public debug(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.debug(objOrMsg, ...args);
    }
    public info(objOrMsg: object | string, ...args: any[]): void {
        loggedInfos.push(typeof objOrMsg === "string" ? objOrMsg : String(args[0]));
    }
    public warn(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.warn(objOrMsg, ...args);
    }
    public error(objOrMsg: object | string, ...args: any[]): void {
        if (typeof objOrMsg === "string") {
            loggedErrors.push({ message: objOrMsg, fields: {} });
            return;
        }
        loggedErrors.push({ message: String(args[0]), fields: { ...objOrMsg } });
    }
    public fatal(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.fatal(objOrMsg, ...args);
    }
    public log(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.log(objOrMsg, ...args);
    }
}

/** Captures logged errors and infos instead of printing them. Call it in `setup`. */
export const captureLoggedErrors = (container: Container) => {
    container.registerDecorator(
        Logger.createDecorator({ decorator: CapturingLogger, dependencies: [] })
    );
};
```

Create `packages/ai-powerups/__tests__/__helpers/ProbeUpdateEntry.ts`. While enabled, an `UpdateEntryUseCase.execute` that runs inside the workflow bypass window (`WorkflowBypassService.isActive()`) first tries to trash, permanently delete and move the entry it is about to update; outside the window it passes straight through (so the setup's own calls are never probed). The AI tool calls the update inside the bypass window (R173), so the recorded attempts prove the bypass exempts only the save block (Review Focus 4, D134, R150). It records the error code of each refused attempt and the identity the update ran as:

```ts
import type {
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryOptionsInput
} from "@webiny/api-headless-cms/types/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { MoveEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
import { getErrorCode } from "./AuthorEntries.js";

/** What one update inside the bypass window saw. */
export interface BypassProbeResult {
    /** `IdentityContext.getIdentity().id` inside the bypass window (R161). */
    identityId: string;
    /** The error code of the refused trash, or `null` when it was NOT refused. */
    trashRefusedWith: string | null;
    permanentDeleteRefusedWith: string | null;
    moveRefusedWith: string | null;
}

export interface BypassProbe {
    enabled: boolean;
    /** One entry per update that ran inside the bypass window while `enabled`. */
    results: BypassProbeResult[];
}

/** Set `enabled` for the test; reset it in `beforeEach`. */
export const bypassProbe: BypassProbe = { enabled: false, results: [] };

export const resetBypassProbe = (): void => {
    bypassProbe.enabled = false;
    bypassProbe.results.length = 0;
};

class ProbeUpdateEntryImpl implements UpdateEntryUseCase.Interface {
    public constructor(
        private bypass: WorkflowBypassService.Interface,
        private identityContext: IdentityContext.Interface,
        private remove: DeleteEntryUseCase.Interface,
        private move: MoveEntryUseCase.Interface,
        private decoratee: UpdateEntryUseCase.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        input: UpdateEntryUseCase.Input<T>,
        options?: UpdateCmsEntryOptionsInput
    ): UpdateEntryUseCase.Return<T> {
        if (bypassProbe.enabled && this.bypass.isActive()) {
            const trashed = await this.remove.execute(model, id, { permanently: false });
            const deleted = await this.remove.execute(model, id, { permanently: true });
            const moved = await this.move.execute(model, id, "folder-2");
            bypassProbe.results.push({
                identityId: this.identityContext.getIdentity().id,
                trashRefusedWith: getErrorCode(trashed),
                permanentDeleteRefusedWith: getErrorCode(deleted),
                moveRefusedWith: getErrorCode(moved)
            });
        }
        return this.decoratee.execute<T>(model, id, input, options);
    }
}

export const ProbeUpdateEntry = UpdateEntryUseCase.createDecorator({
    decorator: ProbeUpdateEntryImpl,
    dependencies: [WorkflowBypassService, IdentityContext, DeleteEntryUseCase, MoveEntryUseCase]
});
```

Create `packages/ai-powerups/__tests__/__helpers/HiddenAiToolRegistry.ts`. A tool that was registered when the workflow was saved and is gone when the step runs (a deploy removed it):

```ts
import { WorkflowAiToolRegistryService } from "@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js";

/** Tool names the registry no longer knows. Clear it in `beforeEach`. */
export const hiddenAiTools = new Set<string>();

class HiddenAiToolRegistryImpl implements WorkflowAiToolRegistryService.Interface {
    public constructor(private decoratee: WorkflowAiToolRegistryService.Interface) {}

    public get(name: string) {
        return hiddenAiTools.has(name) ? null : this.decoratee.get(name);
    }

    public list() {
        return this.decoratee.list().filter(tool => !hiddenAiTools.has(tool.name));
    }
}

export const HiddenAiToolRegistry = WorkflowAiToolRegistryService.createDecorator({
    decorator: HiddenAiToolRegistryImpl,
    dependencies: []
});
```

Create `packages/ai-powerups/__tests__/__helpers/createAiStepContext.ts`, the `createContextHandler` equivalent. It mirrors the production stack (`registerApiRequestStack`: core workflows, then the CMS integration, then the extension that depends on them) and registers the production `Extension`. The license enables workflows (`createTestWcpLicense` already does) and one AI Power-Ups capability, which is what makes the effective `aiPowerups` flag true. `setup` runs after ApiCore, so the fakes registered at its end win:

```ts
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NoopFolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { CmsWorkflowsFeature } from "@webiny/api-headless-cms-workflows";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { Extension } from "~/api/Extension.js";
import { AI_MODEL } from "./aiStepFixtures.js";
import { createAiModel } from "./FakeAi.js";
import {
    createAiPowerUpsSettings,
    createConnectionPreset,
    registerFakeAiPowerUpsSettings
} from "./FakeAiPowerUpsSettings.js";
import { ScriptedAi } from "./ScriptedAi.js";
import { createModelPlugins } from "./AuthorModel.js";
import { FakeTaskService } from "./FakeTaskService.js";
import { registerFakeFolders } from "./FakeFolders.js";
import { captureLoggedErrors } from "./CapturingLogger.js";
import { ProbeUpdateEntry } from "./ProbeUpdateEntry.js";
import { HiddenAiToolRegistry } from "./HiddenAiToolRegistry.js";

/** The test license plus one AI Power-Ups capability: `canUseAiPowerups` is true, workflows too. */
const createAiTestLicense = (): DecryptedWcpProjectLicense => {
    const base = createTestWcpLicense();
    return {
        ...base,
        package: {
            ...base.package,
            features: {
                ...base.package.features,
                [PROJECT_PACKAGE_FEATURE_NAME.AI_POWERUPS]: {
                    enabled: true,
                    options: { lexicalGeneration: true }
                }
            }
        }
    };
};

/** The identity of the request and the requester of every review in the e2e (passed explicitly). */
export const REQUESTER_IDENTITY: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

/**
 * Another identity, the ambient one of a task run: a task runner does not run as the requester,
 * the handler switches to it (R161).
 */
export const OTHER_IDENTITY: IdentityData = {
    id: "id-other-admin",
    type: "admin",
    displayName: "Olive Other"
};

/** The connection with a stored key the capability resolver and the model list read (R169). */
export const ANTHROPIC_CONNECTION = createConnectionPreset({ id: "conn-1", sdkName: "anthropic" });

/**
 * A CMS request context with the whole stack of the AI step: `WorkflowsFeature`,
 * `CmsWorkflowsFeature` and the production ai-powerups `Extension`. `ai` is the scripted model;
 * `presets` and `capabilityItems` are the live settings arrays and objects the fake settings
 * return: change them in place during a test (remove the connection, disable the capability).
 */
export const createAiStepContext = async () => {
    const ai = new ScriptedAi();
    // `AI_MODEL` is "<sdkName>/<modelId>": the model the step picks is the one the list offers.
    const [sdkName, modelId] = AI_MODEL.split("/");
    ai.models = [createAiModel(sdkName, modelId)];
    const presets = [ANTHROPIC_CONNECTION];
    const capabilityItems: Record<string, unknown> = {};
    const settings = createAiPowerUpsSettings({ connections: presets, capabilityItems });

    const handler = createCmsTestHandler({
        identity: REQUESTER_IDENTITY,
        testProjectLicense: createAiTestLicense(),
        legacyPlugins: createModelPlugins(),
        setup: container => {
            // Mirror the production stack: core workflows, the CMS integration, then the AI step.
            WorkflowsFeature.register(container);
            CmsWorkflowsFeature.register(container);
            // ACO is not part of the harness: the CMS adapter reads these stand-ins. The
            // folder-level-permission stand-in is registered here, in `setup`; confirm on the first
            // run, and if the production registration wins, fall back to registering it with
            // `createRegisterExtensionPlugin` in `legacyPlugins` as api-headless-cms-workflows does.
            container.register(NoopFolderLevelPermissions);
            registerFakeFolders(container);
            // The saver and the reach call `TaskService`; there is no background-tasks feature.
            container.register(FakeTaskService);
            container.registerInstance(GetTaskUseCase, { execute: async () => null });
            Extension.register(container);

            // Fakes last, so they win over the registrations above (nothing calls a model).
            container.registerInstance(Ai, ai);
            registerFakeAiPowerUpsSettings(container, settings);
            container.registerInstance(Encryption, {
                encrypt: async (plain: string) => plain,
                decrypt: async (encrypted: string) => `decrypted:${encrypted}`
            } as unknown as Encryption.Interface);
            captureLoggedErrors(container);
            container.registerDecorator(ProbeUpdateEntry);
            container.registerDecorator(HiddenAiToolRegistry);
        }
    });
    const context = await handler.getContext<CmsContext>();

    return { context, ai, presets, capabilityItems };
};
```

Create `packages/ai-powerups/__tests__/features/WorkflowReview/AiStep.e2e.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Actor, ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import { Review } from "@webiny/api-workflows/domain/review/Review.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "@webiny/api-workflows/features/review/ReviewSaver/abstractions.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import { RestartReviewStepUseCase } from "@webiny/api-workflows/features/review/RestartReviewStep/index.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { WorkflowStepRunTaskHandler } from "@webiny/api-workflows/features/stepRun/WorkflowStepRunTask/index.js";
import { StepRunner } from "@webiny/api-workflows/features/stepRun/StepRunner/index.js";
import { STEP_RUN_STALE_CHECK_INTERVAL_MS } from "@webiny/api-workflows/features/stepRun/constants.js";
import type { StepRunTaskInput } from "@webiny/api-workflows/features/stepRun/types.js";
import { StepType } from "@webiny/api-workflows/features/stepTypes/StepType/index.js";
import { ListWorkflowStepTypesUseCase } from "@webiny/api-workflows/features/config/ListWorkflowStepTypes/index.js";
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
import {
    AI_STEP_CONTENT_TOO_LARGE_MESSAGE,
    AI_STEP_MAX_INPUT_CHARACTERS,
    AI_TOOL_STEP_NOT_RUNNING_MESSAGE,
    READ_TARGET_TOOL_NAME,
    UPDATE_TARGET_FIELDS_TOOL_NAME
} from "@webiny/api-workflows/features/aiTools/constants.js";
import type { ReviewTargetContent } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { WORKFLOWS_REVIEW_CAPABILITY_ID } from "~/api/features/WorkflowReview/constants.js";
import { AI_MODEL, AI_STEP_ID } from "~tests/__helpers/aiStepFixtures.js";
import type { ScriptedStep } from "~tests/__helpers/ScriptedAi.js";
import { AUTHOR_NAMESPACE } from "~tests/__helpers/AuthorModel.js";
import {
    createAuthorEntry,
    expectOk,
    getAuthorModel,
    getErrorCode,
    readEntry
} from "~tests/__helpers/AuthorEntries.js";
import { abortedTasks, resetFakeTasks, triggeredTasks } from "~tests/__helpers/FakeTaskService.js";
import { createFakeTaskController } from "~tests/__helpers/FakeTaskController.js";
import type { FakeTaskControllerParams } from "~tests/__helpers/FakeTaskController.js";
import { loggedErrors, loggedInfos } from "~tests/__helpers/CapturingLogger.js";
import { bypassProbe, resetBypassProbe } from "~tests/__helpers/ProbeUpdateEntry.js";
import { hiddenAiTools } from "~tests/__helpers/HiddenAiToolRegistry.js";
import {
    ANTHROPIC_CONNECTION,
    OTHER_IDENTITY,
    REQUESTER_IDENTITY,
    createAiStepContext
} from "~tests/__helpers/createAiStepContext.js";

/** The identity of the request (`REQUESTER_IDENTITY`), as the requester of every review here. */
const ADMIN: Actor = {
    type: "user",
    id: REQUESTER_IDENTITY.id,
    displayName: REQUESTER_IDENTITY.displayName,
    identityType: "admin"
};

/** The `data` of a `readTarget` tool result. */
interface ReadTargetToolResult {
    ok: boolean;
    data: ReviewTargetContent;
}

const BIO = "Writes about cats.";
const EDITED_BIO = "Writes about cats and dogs.";

const DEFINITION: TaskDefinition.Metadata = {
    id: "workflowsStepRun",
    title: "Workflow step run",
    isPrivate: true,
    maxIterations: 10000
};

const createAiWorkflowValues = (
    tools: string[] = [READ_TARGET_TOOL_NAME, UPDATE_TARGET_FIELDS_TOOL_NAME]
): WorkflowValues => {
    return {
        id: "workflow-1",
        name: "AI review",
        models: [AUTHOR_NAMESPACE],
        steps: [
            {
                id: AI_STEP_ID,
                title: "AI review",
                description: "The AI checks the profile.",
                color: "blue",
                type: "ai",
                notifications: [],
                config: {
                    instructions: "Fix typos in the bio and approve a friendly profile.",
                    model: AI_MODEL,
                    tools
                }
            }
        ]
    };
};

interface SetupParams {
    bio?: string;
    /** The tool allowlist of the AI step; both built-in tools by default. */
    tools?: string[];
}

/** A text of `length` characters that is spaced like prose (no single unbroken run). */
const createSpacedText = (length: number): string => {
    return "word ".repeat(Math.ceil(length / 5)).slice(0, length);
};

/** A stored AI workflow, an author entry and a review requested through the engine. */
const setup = async (params: SetupParams = {}) => {
    const env = await createAiStepContext();
    const { context } = env;
    expectOk(
        await context.container
            .resolve(StoreWorkflowUseCase)
            .execute({ workflow: createAiWorkflowValues(params.tools), actor: ADMIN })
    );
    const entry = await createAuthorEntry(context, { name: "Ann", bio: params.bio ?? BIO });
    const review = expectOk(
        await context.container.resolve(RequestReviewUseCase).execute({
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id,
            actor: ADMIN
        })
    );

    const repository = context.container.resolve(ReviewRepository);
    const saver = context.container.resolve(ReviewSaver);
    const identityContext = context.container.resolve(IdentityContext);
    const handler = context.container.resolveImplementation(
        WorkflowStepRunTaskHandler
    ) as TaskHandler.Interface<StepRunTaskInput>;
    const input: StepRunTaskInput = { reviewId: review.id, stepId: AI_STEP_ID };

    return {
        ...env,
        entry,
        review,
        /** The id of the task the reach triggered for the AI step. */
        taskId: triggeredTasks[0]?.id as string,
        readReview: async (): Promise<ReviewData> => expectOk(await repository.get(review.id)),
        readStoredEntry: () => readEntry(context, entry.id),
        /** Fails the step as a hook or stuck detection would, through the saver. */
        failStoredStep: async (reason: string): Promise<void> => {
            const stored = Review.fromData(expectOk(await repository.get(review.id)));
            expectOk(stored.fail({ stepId: AI_STEP_ID, reason, now: new Date().toISOString() }));
            expectOk(await saver.save(stored));
        },
        cancel: async (): Promise<void> => {
            expectOk(
                await context.container
                    .resolve(CancelReviewUseCase)
                    .execute({ reviewId: review.id, actor: ADMIN })
            );
        },
        restart: async (): Promise<ReviewData> => {
            return expectOk(
                await context.container
                    .resolve(RestartReviewStepUseCase)
                    .execute({ reviewId: review.id, stepId: AI_STEP_ID, actor: ADMIN })
            );
        },
        /**
         * Runs the real handler for `taskId` as a task runner would: authorization off (R161).
         * `ambientIdentity` is the identity in force around the run (a task runner is not the
         * requester); the handler must switch to the requester itself.
         */
        run: (
            taskId: string,
            controllerParams: Partial<FakeTaskControllerParams> = {},
            ambientIdentity?: IdentityData
        ) => {
            const { controller, task, outputUpdates } = createFakeTaskController({
                taskId,
                createdById: ADMIN.id,
                input,
                ...controllerParams
            });
            const runHandler = () => {
                return identityContext.withoutAuthorization(() => {
                    return handler.run({ input: task.input, controller, definition: DEFINITION });
                });
            };
            return {
                outputUpdates,
                result: ambientIdentity
                    ? identityContext.withIdentity(new AuthenticatedIdentity(ambientIdentity), runHandler)
                    : runHandler()
            };
        }
    };
};

const readAndEdit = (bio: string): ScriptedStep[] => {
    return [
        { toolCalls: [{ name: READ_TARGET_TOOL_NAME, input: {} }] },
        { toolCalls: [{ name: UPDATE_TARGET_FIELDS_TOOL_NAME, input: { fields: { bio } } }] }
    ];
};

beforeEach(() => {
    resetFakeTasks();
    resetBypassProbe();
    hiddenAiTools.clear();
    loggedErrors.length = 0;
    loggedInfos.length = 0;
});

afterEach(() => {
    vi.useRealTimers();
});

describe("AI step end to end: a CMS review through the real handler and tools", () => {
    describe("registration (R166, R177, R178)", () => {
        it("registers the ai step type and the ai runner, and lists the ai row from the registry", async () => {
            const { context } = await setup();

            expect(context.container.resolveAll(StepType).map(type => type.type)).toContain("ai");
            expect(context.container.resolveAll(StepRunner).map(runner => runner.type)).toContain(
                "ai"
            );
            const rows = expectOk(
                await context.container.resolve(ListWorkflowStepTypesUseCase).execute()
            );
            const ai = rows.find(row => row.type === "ai");
            expect(ai).toMatchObject({ type: "ai", available: true, unavailableReason: null });
            expect(ai?.configSchema).toMatchObject({
                properties: { instructions: { ui: "textarea" } }
            });
        });

        it("reached the step by triggering the task as the requester (R149, R161)", async () => {
            const { review } = await setup();

            expect(triggeredTasks).toHaveLength(1);
            expect(triggeredTasks[0]).toMatchObject({
                definition: "workflowsStepRun",
                input: { reviewId: review.id, stepId: AI_STEP_ID },
                identityId: ADMIN.id
            });
            expect(review).toMatchObject({ currentStepState: "inReview", currentStepType: "ai" });
            expect(review.steps[0]).toMatchObject({
                state: "inReview",
                taskId: triggeredTasks[0].id,
                owner: { type: "ai", id: ADMIN.id, displayName: ADMIN.displayName }
            });
        });
    });

    describe("decisions (R171)", () => {
        it("approves: the review is approved as the AI actor and the entry is untouched", async () => {
            const { run, taskId, ai, readReview, readStoredEntry, entry } = await setup();
            ai.response = {
                steps: [],
                decision: { approved: true, comment: "A friendly profile.", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await readReview();
            expect(stored).toMatchObject({ state: "approved", currentStepState: "approved" });
            expect(stored.steps[0]).toMatchObject({
                state: "approved",
                comment: "A friendly profile.",
                issues: [],
                owner: { type: "ai", id: ADMIN.id },
                taskId
            });
            expect(ai.calls).toHaveLength(1);
            expect(ai.calls[0].model).toBe(AI_MODEL);
            expect(String(ai.calls[0].prompt)).toContain("Fix typos in the bio");
            expect(String(ai.calls[0].prompt)).toContain(BIO);
            const storedEntry = await readStoredEntry();
            expect(storedEntry.id).toBe(entry.id);
            expect(storedEntry.values.bio).toBe(BIO);
            expect(loggedErrors).toEqual([]);
        });

        it("rejects with the comment and stores the issues on the step", async () => {
            const { run, taskId, ai, readReview, readStoredEntry } = await setup();
            ai.response = {
                steps: [],
                decision: {
                    approved: false,
                    comment: "The bio is not about the author.",
                    issues: [
                        {
                            fieldPath: "bio",
                            severity: "error",
                            message: "Talks about cats only.",
                            suggestion: "Write about the author."
                        }
                    ]
                }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await readReview();
            expect(stored.state).toBe("rejected");
            expect(stored.steps[0]).toMatchObject({
                state: "rejected",
                comment: "The bio is not about the author.",
                owner: { type: "ai", id: ADMIN.id },
                issues: [
                    {
                        fieldPath: "bio",
                        severity: "error",
                        message: "Talks about cats only.",
                        suggestion: "Write about the author."
                    }
                ]
            });
            expect((await readStoredEntry()).values.bio).toBe(BIO);
        });

        it("fails the step when a rejection has no comment (D100)", async () => {
            const { run, taskId, ai, readReview } = await setup();
            ai.response = { steps: [], decision: { approved: false, comment: "no", issues: [] } };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await readReview();
            expect(stored.state).toBe("inProgress");
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: "The AI review rejected without a comment."
            });
        });
    });

    describe("tools and the write (R172, R173, D36, D62, Review Focus 4)", () => {
        it("reads the target, edits a field through the CMS update path and approves", async () => {
            const { run, taskId, ai, readReview, readStoredEntry, entry, context } = await setup();
            ai.response = {
                steps: readAndEdit(EDITED_BIO),
                decision: { approved: true, comment: "Fixed the bio.", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            // readTarget answered the content with the writable flags.
            expect(ai.toolResults[0]).toMatchObject({ name: READ_TARGET_TOOL_NAME });
            const content = (ai.toolResults[0].result as ReadTargetToolResult).data;
            expect(content.fields.find(field => field.path === "bio")).toMatchObject({
                value: BIO,
                writable: true
            });
            // updateTargetFields wrote exactly that field, on the reviewed revision (A57).
            expect(ai.toolResults[1].result).toEqual({ ok: true, data: { applied: ["bio"] } });
            const stored = await readStoredEntry();
            expect(stored.id).toBe(entry.id);
            expect(stored.values).toMatchObject({ name: "Ann", bio: EDITED_BIO });
            expect((await readReview()).state).toBe("approved");
            // The bypass was open only around the write: it is closed now, and the approved
            // revision is locked against everyone else (D80).
            expect(context.container.resolve(WorkflowBypassService).isActive()).toBe(false);
            const model = await getAuthorModel(context);
            const blocked = await context.container
                .resolve(UpdateEntryUseCase)
                .execute(model, entry.id, { values: { bio: "Edited by someone else." } });
            expect(blocked.isFail()).toBe(true);
            expect(getErrorCode(blocked)).toBe("Workflows/Review/TargetLocked");
            expect(loggedErrors).toEqual([]);
        });

        it("refuses an unknown path and writes nothing, atomically; the step still decides", async () => {
            const { run, taskId, ai, readReview, readStoredEntry } = await setup();
            ai.response = {
                steps: [
                    {
                        toolCalls: [
                            {
                                name: UPDATE_TARGET_FIELDS_TOOL_NAME,
                                input: { fields: { bio: "New bio.", entryId: "forged" } }
                            }
                        ]
                    }
                ],
                decision: { approved: true, comment: "", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect(ai.toolResults[0].result).toMatchObject({ ok: false });
            expect((await readStoredEntry()).values.bio).toBe(BIO);
            expect((await readReview()).state).toBe("approved");
        });

        it("refuses trash, permanent delete and move from inside the bypass window while the update succeeds", async () => {
            const { run, taskId, ai, readStoredEntry } = await setup();
            bypassProbe.enabled = true;
            ai.response = {
                steps: readAndEdit(EDITED_BIO),
                decision: { approved: true, comment: "Fixed the bio.", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            // One update ran inside the tool's bypass window. The attempts it made were refused
            // with the exact codes: the bypass exempts the save block and nothing else (D134, R150).
            expect(bypassProbe.results).toHaveLength(1);
            expect(bypassProbe.results[0]).toMatchObject({
                trashRefusedWith: "Workflows/Review/ActiveReviewOnTrash",
                permanentDeleteRefusedWith: "Workflows/Review/ActiveReviewOnTrash",
                moveRefusedWith: "Workflows/Review/TargetLocked"
            });
            const stored = await readStoredEntry();
            expect(stored.values.bio).toBe(EDITED_BIO);
            // Not moved and not in the bin.
            expect(stored.location?.folderId).toBe("root");
            expect(stored.deletedOn).toBeNull();
        });

        it("writes as the requester even when the handler runs under another identity (R161, Review Focus 4)", async () => {
            const { run, taskId, ai, readStoredEntry } = await setup();
            bypassProbe.enabled = true;
            ai.response = {
                steps: readAndEdit(EDITED_BIO),
                decision: { approved: true, comment: "Fixed the bio.", issues: [] }
            };
            expect(OTHER_IDENTITY.id).not.toBe(ADMIN.id);

            // The ambient identity of the run is not the requester; the handler switches to it.
            const { result } = run(taskId, {}, OTHER_IDENTITY);

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect(bypassProbe.results).toHaveLength(1);
            expect(bypassProbe.results[0].identityId).toBe(ADMIN.id);
            const stored = await readStoredEntry();
            expect(stored.values.bio).toBe(EDITED_BIO);
            expect(stored.savedBy.id).toBe(ADMIN.id);
            expect(stored.modifiedBy?.id).toBe(ADMIN.id);
        });

        it("offers only the allowlisted tool: a call to updateTargetFields is not available and the entry is untouched", async () => {
            const { run, taskId, ai, readReview, readStoredEntry } = await setup({
                tools: [READ_TARGET_TOOL_NAME]
            });
            ai.response = {
                steps: [
                    {
                        toolCalls: [
                            {
                                name: UPDATE_TARGET_FIELDS_TOOL_NAME,
                                input: { fields: { bio: EDITED_BIO } }
                            }
                        ]
                    }
                ],
                decision: { approved: true, comment: "", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect(Object.keys(ai.calls[0].tools ?? {})).toEqual([READ_TARGET_TOOL_NAME]);
            expect(ai.toolResults[0].result).toMatchObject({ ok: false });
            expect((await readStoredEntry()).values.bio).toBe(BIO);
            expect((await readReview()).state).toBe("approved");
        });

        it("answers a bad value with a not-ok result, leaves the entry untouched and closes the bypass", async () => {
            const { run, taskId, ai, readStoredEntry, context } = await setup();
            ai.response = {
                steps: [
                    {
                        toolCalls: [
                            {
                                name: UPDATE_TARGET_FIELDS_TOOL_NAME,
                                input: { fields: { bio: 42 } }
                            }
                        ]
                    }
                ],
                decision: { approved: true, comment: "", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect(ai.toolResults[0].result).toMatchObject({ ok: false });
            expect((await readStoredEntry()).values.bio).toBe(BIO);
            expect(context.container.resolve(WorkflowBypassService).isActive()).toBe(false);
        });
    });

    describe("failures are fixed texts and the step is restartable (R170, D8)", () => {
        it("fails with the model text when the connection is gone, then restarts and approves", async () => {
            const { run, taskId, ai, presets, readReview, restart } = await setup();
            // The connection is removed after the review was requested.
            presets.splice(0, presets.length);

            await expect(run(taskId).result).resolves.toMatchObject({ status: "done" });

            const failed = await readReview();
            expect(failed.state).toBe("inProgress");
            expect(failed.steps[0]).toMatchObject({
                state: "failed",
                comment: `The model "${AI_MODEL}" is not available.`
            });
            expect(ai.calls).toHaveLength(0);
            expect(loggedErrors).toEqual([]);

            // The connection is back; the author restarts the failed step: a new task, a new run.
            presets.push(ANTHROPIC_CONNECTION);
            const restarted = await restart();
            const newTaskId = triggeredTasks[1].id;
            expect(newTaskId).not.toBe(taskId);
            expect(restarted.steps[0]).toMatchObject({ state: "inReview", taskId: newTaskId });
            expect(restarted.steps[0].runs).toHaveLength(1);
            expect(restarted.steps[0].runs[0]).toMatchObject({
                taskId,
                outcome: "failed",
                reason: `The model "${AI_MODEL}" is not available.`
            });
            ai.response = {
                steps: [],
                decision: { approved: true, comment: "Fine after the restart.", issues: [] }
            };

            await expect(run(newTaskId).result).resolves.toMatchObject({ status: "done" });

            const approved = await readReview();
            expect(approved.state).toBe("approved");
            expect(approved.steps[0]).toMatchObject({
                state: "approved",
                comment: "Fine after the restart.",
                taskId: newTaskId
            });
            expect(ai.calls).toHaveLength(1);
        });

        it("fails with the capability text when the capability was switched off", async () => {
            const { run, taskId, ai, capabilityItems, readReview } = await setup();
            capabilityItems[WORKFLOWS_REVIEW_CAPABILITY_ID] = { enabled: false };

            await expect(run(taskId).result).resolves.toMatchObject({ status: "done" });

            const stored = await readReview();
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: "The AI review capability is not available."
            });
            expect(ai.calls).toHaveLength(0);
        });

        it("fails with the tool text when an allowlisted tool is no longer registered", async () => {
            const { run, taskId, ai, readReview } = await setup();
            hiddenAiTools.add(UPDATE_TARGET_FIELDS_TOOL_NAME);

            await expect(run(taskId).result).resolves.toMatchObject({ status: "done" });

            const stored = await readReview();
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: `The AI tool "${UPDATE_TARGET_FIELDS_TOOL_NAME}" is not available.`
            });
            expect(ai.calls).toHaveLength(0);
        });

        it("fails with the too-large text and sends nothing to the model (R175: no truncation)", async () => {
            // Spaced prose over the cap, so the entry is a normal one the CMS can store; the
            // size follows the constant and does not hard-code a number.
            const bio = createSpacedText(AI_STEP_MAX_INPUT_CHARACTERS + 5000);
            const { run, taskId, ai, readReview, readStoredEntry } = await setup({ bio });

            await expect(run(taskId).result).resolves.toMatchObject({ status: "done" });

            const stored = await readReview();
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: AI_STEP_CONTENT_TOO_LARGE_MESSAGE
            });
            expect(ai.calls).toHaveLength(0);
            expect((await readStoredEntry()).values.bio).toBe(bio);
        });

        it("fails with the timeout text when the task has no runtime left for the call (R175)", async () => {
            const { run, taskId, ai, readReview } = await setup();

            // The handler keeps 30 seconds of margin: with 30 seconds left the signal fires at once.
            await expect(
                run(taskId, { remainingMilliseconds: 30000 }).result
            ).resolves.toMatchObject({ status: "done" });

            const stored = await readReview();
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: "The AI review timed out."
            });
            expect(ai.calls).toHaveLength(0);
        });

        it("fails a re-entered task (iteration 2) without a model call (R170)", async () => {
            const { run, taskId, ai, readReview } = await setup();

            // The first entry persisted `{ idWaits: 0 }`; a re-entered task reads it and is on its
            // second iteration.
            await expect(
                run(taskId, { iterations: 2, output: { idWaits: 0, state: null } }).result
            ).resolves.toMatchObject({ status: "done" });

            const stored = await readReview();
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: "The AI review failed."
            });
            expect(ai.calls).toHaveLength(0);
        });

        it("persists the output once the id wait is over, before the call (R170)", async () => {
            const { run, taskId, ai } = await setup();
            ai.response = { steps: [], decision: { approved: true, comment: "", issues: [] } };

            const { result, outputUpdates } = run(taskId);

            await result;
            expect(outputUpdates).toEqual([{ idWaits: 0, state: null }]);
        });
    });

    describe("a cancel or restart during the model call writes nothing (R175, A56, Review Focus 1)", () => {
        beforeEach(() => {
            // Only `Date` is faked: the runner reads `Date.now()` for its 5-second throttle. The
            // clock starts at the real time so storage clients see no skew.
            vi.useFakeTimers({ toFake: ["Date"], now: new Date() });
        });

        it("stops the call and writes nothing when the review is cancelled during the call", async () => {
            const { run, taskId, ai, cancel, readReview, readStoredEntry } = await setup();
            ai.response = {
                steps: [
                    { toolCalls: [{ name: READ_TARGET_TOOL_NAME, input: {} }] },
                    {
                        // The stored review is cancelled while the model works; the clock moves
                        // past the throttle so the next tool call looks again.
                        before: async () => {
                            await cancel();
                            vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                        },
                        toolCalls: [
                            {
                                name: UPDATE_TARGET_FIELDS_TOOL_NAME,
                                input: { fields: { bio: "Late edit." } }
                            }
                        ]
                    }
                ],
                decision: { approved: true, comment: "Approved after the cancel.", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            // The late write was refused before it reached the tool, the call was stopped.
            expect(ai.toolResults[1].result).toEqual({
                ok: false,
                error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE
            });
            expect(ai.calls).toHaveLength(1);
            // Nothing of the AI landed: the entry, and the review exactly as the cancel left it.
            expect((await readStoredEntry()).values.bio).toBe(BIO);
            const stored = await readReview();
            expect(stored.state).toBe("cancelled");
            expect(stored.isActive).toBe(false);
            expect(stored.steps[0].comment).not.toBe("Approved after the cancel.");
            expect(stored.steps[0].state).not.toBe("approved");
            expect(abortedTasks.map(aborted => aborted.id)).toContain(taskId);
            expect(loggedInfos).toContain("Ignored a stale step run failure.");
            expect(loggedErrors).toEqual([]);
        });

        it("stops the call and writes nothing when the step is restarted under a new task during the call", async () => {
            const { run, taskId, ai, failStoredStep, restart, readReview, readStoredEntry } =
                await setup();
            ai.response = {
                steps: [
                    { toolCalls: [{ name: READ_TARGET_TOOL_NAME, input: {} }] },
                    {
                        // The step fails elsewhere and is restarted: it now belongs to task-2.
                        before: async () => {
                            await failStoredStep("The step failed elsewhere.");
                            await restart();
                            vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                        },
                        toolCalls: [
                            {
                                name: UPDATE_TARGET_FIELDS_TOOL_NAME,
                                input: { fields: { bio: "Late edit." } }
                            }
                        ]
                    }
                ],
                decision: { approved: true, comment: "Approved by the old task.", issues: [] }
            };

            const { result } = run(taskId);

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect(ai.toolResults[1].result).toEqual({
                ok: false,
                error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE
            });
            expect(ai.calls).toHaveLength(1);
            expect((await readStoredEntry()).values.bio).toBe(BIO);
            // The stored review is what the restart left: the step in review under the new task,
            // the failed attempt in `runs`, nothing from the old task.
            const stored = await readReview();
            const newTaskId = triggeredTasks[1].id;
            expect(newTaskId).not.toBe(taskId);
            expect(stored.state).toBe("inProgress");
            expect(stored.steps[0]).toMatchObject({ state: "inReview", taskId: newTaskId });
            expect(stored.steps[0].runs).toHaveLength(1);
            expect(stored.steps[0].runs[0]).toMatchObject({
                taskId,
                outcome: "failed",
                reason: "The step failed elsewhere."
            });
            expect(stored.steps[0].comment).not.toBe("Approved by the old task.");
            expect(loggedInfos).toContain("Ignored a stale step run failure.");
            expect(loggedErrors).toEqual([]);
        });
    });
});
```

- [ ] **Step 2: Run the test to see the red**

This task adds an acceptance test over finished tasks (1-19): there is nothing left to implement but the test dependencies and `ci.config.json`. The red this step can record is the dependency check:

Run: `yarn adio 2>&1 | tail -30`
Expected: FAIL, naming `@webiny/api-headless-cms-testing`, `@webiny/api-headless-cms-workflows` and `@webiny/api-aco` as imported by `packages/ai-powerups/__tests__` but not declared (Step 3 declares them). Checked against `.adiorc.js` and the adio source: `ignore.devDependencies: true` only skips the check for *unused* devDependencies, and adio scans every `.js`/`.ts` file of the package (`__tests__` included), so an undeclared import there is still reported as missing. If the first run unexpectedly reports nothing, there is no red to record here: this is an acceptance test over implemented tasks, say so in the report.

Run: `yarn test packages/ai-powerups/__tests__/features/WorkflowReview/AiStep.e2e.test.ts 2>&1 | tail -50`
Expected: the file may already pass, because the workspace links resolve the three packages without a declaration. Any other failure points at the task it exercises (a registration in `Extension.ts`, a handler or tool behaviour), not at this file: fix it in that task's code and say so in the commit message of this task; record it in the report. Known sensitive spots to check first when something fails: the license (`createAiTestLicense`: `aiPowerups` must be effective, otherwise `Extension` returns early and no `ai` type exists), the order of `setup` (the fakes must come after `Extension.register`), and the size of the `bio` in the too-large test (a storage item limit would show as a failed `createAuthorEntry`).

- [ ] **Step 3: Declare the dependencies and the CI config**

In `packages/ai-powerups/package.json` add the three devDependencies, in alphabetical order with the existing ones (Task 16 already added `graphql` and the `@webiny/api-workflows` dependency; they stay):

```json
    "@webiny/api-aco": "0.0.0",
    "@webiny/api-graphql": "0.0.0",
    "@webiny/api-headless-cms-testing": "0.0.0",
    "@webiny/api-headless-cms-workflows": "0.0.0",
    "@webiny/build-tools": "0.0.0",
```

(`@webiny/api-graphql` and `@webiny/build-tools` are the existing neighbours; only the three new lines are added.) `packages/ai-powerups/ci.config.json` was created in Step 1.

Run: `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio 2>&1 | tail -30`, `yarn check-ts-configs 2>&1 | tail -30`, `yarn webiny sync-dependencies 2>&1 | tail -30`.
Expected: all clean; `packages/ai-powerups/tsconfig.json` and `tsconfig.build.json` gain references to `api-aco`, `api-headless-cms-testing` and `api-headless-cms-workflows`, and `yarn.lock` changes.

Verify there is no package cycle (R177, user answer Q5):

Run: `grep -n "@webiny/ai-powerups" packages/api-workflows/package.json packages/api-headless-cms-workflows/package.json packages/api-website-builder-workflows/package.json packages/api-aco/package.json packages/api-headless-cms-testing/package.json`
Expected: no output.

- [ ] **Step 4: Run the end-to-end test on both storages, one at a time**

Run: `yarn test packages/ai-powerups/__tests__/features/WorkflowReview/AiStep.e2e.test.ts 2>&1 | tail -50`
Expected: PASS.

Then, after the first command has finished (parallel `test:os` runs clash on port 8001):

Run: `yarn test:os packages/ai-powerups/__tests__/features/WorkflowReview/AiStep.e2e.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and the whole ai-powerups test set once under `test:os`**

`ci.config.json` applies to the whole package, so every ai-powerups test file now also runs on the OpenSearch storage preset. Run the existing files once under `yarn test:os`, by path, one command after the other (this is the explicit exception to "no whole suites"; fix or report every failure, do not skip a file):

Run: `yarn test:os packages/ai-powerups/__tests__/features/upgradeFromLegacyProviders.test.ts packages/ai-powerups/__tests__/features/Capabilities/ResolveAiCapabilityUseCase.test.ts packages/ai-powerups/__tests__/features/Capabilities/ListAiCapabilitiesUseCase.test.ts packages/ai-powerups/__tests__/features/Capabilities/CapabilitiesHandler.test.ts packages/ai-powerups/__tests__/features/Connections/ConnectionsHandler.test.ts packages/ai-powerups/__tests__/features/AdminAssistant/AdminAssistantUseCase.test.ts packages/ai-powerups/__tests__/features/AiImageEnrichment/AiImageEnrichmentStreamRoute.test.ts packages/ai-powerups/__tests__/features/AiImageEnrichment/PrepareImageEnrichmentUseCase.test.ts packages/ai-powerups/__tests__/features/AiImageEnrichment/AiImageEnrichmentTask.test.ts packages/ai-powerups/__tests__/features/WbTranslatePage/WbTranslatePageDecorator.test.ts packages/ai-powerups/__tests__/features/WbGeneratePageContent/ComponentFilter.test.ts 2>&1 | tail -50`
Expected: PASS. If a file fails only under the OpenSearch preset, it is a pre-existing storage-preset problem of that file (none of them touches storage): fix it if the cause is trivial, otherwise report it with the file name and the first failing assertion instead of editing unrelated tests.

Run, after it finished: `yarn test:os packages/ai-powerups/__tests__/features/ConfiguredAiModels/ConfiguredAiModelsService.test.ts packages/ai-powerups/__tests__/features/ConfiguredAiModels/ConfiguredAiModelsRegistration.test.ts packages/ai-powerups/__tests__/features/Capabilities/ResolveAiCapabilityModel.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/WorkflowsReviewCapability.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/ListWorkflowAiModelsUseCase.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/WorkflowReviewRegistration.test.ts packages/ai-powerups/__tests__/graphql/ListWorkflowAiModelsSchema.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/aiStepConfigSchema.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/aiFailureReasons.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/buildAiStepPrompt.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/aiReviewOutputSchema.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/AiStepRunner.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/AiStepRunnerStale.test.ts 2>&1 | tail -50`.
Expected: PASS.

Phase 5 still green (the automation path of the neutral runner, unchanged expectations):

Run: `yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskDispatch.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskSignals.test.ts packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types -p ai-powerups --report cli 2>&1 | tail -40`
Expected: no errors. (If the `as never` results of `FakeTaskService` or the `get fail()` literal of Task 19's tests are rejected, use the cast through `unknown` the earlier tasks use.)

- [ ] **Step 6: Commit**

Run the Global Constraints chain (`yarn`, the tsconfig generator, `yarn adio`, `yarn check-ts-configs`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/ai-powerups --no-cache 2>&1 | tail -30`; restore `.gitleaks.toml`; no other package's `package.json` may change), then commit:

```
test(ai-powerups): add the AI step end-to-end test and run the package on both storages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
