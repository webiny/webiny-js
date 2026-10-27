### Task 11: Model delete blocks (use case and the "fully delete model" task) and the DB-model bindable test

Spec 9.2, D41, D64, D134 point 4, R64; carry-over from 1b (R38: "the DB-model path, which the harness cannot produce"). Two guards return `Workflows/Model/BoundToWorkflow` listing the bound workflows:

- A `DeleteModelUseCase` decorator, registered after the CMS's own decorators, so it runs first and `DeleteModelWithEntryCleanup` never deletes a bound singleton model's entries.
- A `DeleteModelOperations` decorator (api-headless-cms-tasks) on `fullyDeleteModel`, the entry point of the "fully delete model" background task. The task deletes every entry and folder before it calls `DeleteModelUseCase`, so without this guard a bound model's content (and, through Task 10b, its reviews) would be gone before the first decorator refuses (D134 point 4). The task is refused at start; nothing is deleted.

Both first read the model as the caller (`GetModelUseCase`) and check model delete access; a caller who cannot delete the model gets the CMS's own error from the decorated chain, never the bound workflows' ids and names. A failed workflow lookup blocks with the workflows error (`Workflows/Workflow/Persistence`, fail closed). The use-case tests need a database model (code models cannot be deleted, and the CMS hides code models from callers without access), created with full access in one request and used by a restricted identity in another (A32).

**Files:**
- Modify: `packages/api-headless-cms-workflows/package.json`
- Create: `packages/api-headless-cms-workflows/src/domain/errors.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/listBoundWorkflows.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/canCallerDeleteModel.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/DeleteModelBoundToWorkflowDecorator.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/FullyDeleteModelBoundToWorkflowDecorator.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/hooks/feature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/dbModels.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/RecordingDeleteModelOperations.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/hooks/deleteModel.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/workflows/bindableDbModel.test.ts`

**Interfaces:**
- Consumes: `DeleteModelUseCase` (`@webiny/api-headless-cms/features/contentModel/DeleteModel/index.js`), `GetModelUseCase`, `AccessControl`, `DeleteModelOperations` (`@webiny/api-headless-cms-tasks/graphql/deleteModel/abstractions.js`), `IDeleteCmsModelTask`, `DeleteCmsModelTaskStatus` (`@webiny/api-headless-cms-tasks/features/DeleteModelTask/types.js`), `ListWorkflowsUseCase`, `WorkflowPersistenceError`, `CreateGroupUseCase`, `CreateModelUseCase`, `toCmsNamespace`.
- Produces:
  - `ModelBoundToWorkflowError` (`Workflows/Model/BoundToWorkflow`), data `ModelBoundToWorkflowErrorData { modelId: string; workflows: BoundWorkflow[] }`, `BoundWorkflow { id: string; name: string }`; joined to `IDeleteModelUseCaseErrors` as `boundToWorkflow`, and `WorkflowPersistenceError` as `workflowPersistence`, by module augmentation.
  - `listBoundWorkflows(listWorkflows, modelId): Promise<Result<BoundWorkflow[], WorkflowPersistenceError>>`; `canCallerDeleteModel(getModel, accessControl, modelId): Promise<boolean>`.
  - `DeleteModelBoundToWorkflowDecorator` and `FullyDeleteModelBoundToWorkflowDecorator`, registered by `CmsHooksFeature`.
  - Test helpers `createDbModel(context, modelId)` and `RecordingDeleteModelOperations`.

- [ ] **Step 1: Dependency**

In `packages/api-headless-cms-workflows/package.json` add `"@webiny/api-headless-cms-tasks": "0.0.0"` to `dependencies` (alphabetical, after `@webiny/api-headless-cms`). It does not depend on the workflows packages, so there is no cycle. Run `yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio` and fix what `adio` reports.

- [ ] **Step 2: Write the helpers and the failing tests**

Create `packages/api-headless-cms-workflows/__tests__/__helpers/dbModels.ts`:

```ts
import type { CmsContext, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { CreateGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/index.js";
import { CreateModelUseCase } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { expectOk } from "./entries.js";

/**
 * Creates a database model (not a code model) with one "title" field, in its own group. Needs a
 * context with CMS write access to groups and models (the default `*`).
 */
export const createDbModel = async (context: CmsContext, modelId: string): Promise<CmsModel> => {
    const group = expectOk(
        await context.container.resolve(CreateGroupUseCase).execute({
            name: `${modelId} group`,
            slug: `${modelId}-group`,
            icon: { type: "icon", name: "fas/star" },
            description: ""
        })
    );
    const singular = modelId.charAt(0).toUpperCase() + modelId.slice(1);
    return expectOk(
        await context.container.resolve(CreateModelUseCase).execute({
            name: singular,
            modelId,
            singularApiName: singular,
            pluralApiName: `${singular}s`,
            group: group.id,
            titleFieldId: "title",
            fields: [
                {
                    id: "title",
                    fieldId: "title",
                    type: "text",
                    label: "Title",
                    storageId: "text@title"
                }
            ],
            layout: [["title"]]
        } as CreateModelUseCase.Input)
    );
};
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/RecordingDeleteModelOperations.ts`:

```ts
import { DeleteModelOperations } from "@webiny/api-headless-cms-tasks/graphql/deleteModel/abstractions.js";
import {
    DeleteCmsModelTaskStatus,
    type IDeleteCmsModelTask,
    type IStoreValue
} from "@webiny/api-headless-cms-tasks/features/DeleteModelTask/types.js";

/**
 * Stands in for the background-task implementation (not registered in this package's harness), so
 * tests see whether `fullyDeleteModel` reached it. Register with
 * `container.registerInstance(DeleteModelOperations, operations)`; decorators still apply.
 */
export class RecordingDeleteModelOperations implements DeleteModelOperations.Interface {
    public readonly fullyDeleted: string[] = [];

    public async listModelsBeingDeleted(): Promise<IStoreValue[]> {
        return [];
    }

    public async isModelBeingDeleted(): Promise<boolean> {
        return false;
    }

    public async fullyDeleteModel(modelId: string): Promise<IDeleteCmsModelTask> {
        this.fullyDeleted.push(modelId);
        return { id: "task-1", status: DeleteCmsModelTaskStatus.RUNNING, total: 0, deleted: 0 };
    }

    public async cancelFullyDeleteModel(): Promise<IDeleteCmsModelTask> {
        return { id: "task-1", status: DeleteCmsModelTaskStatus.CANCELED, total: 0, deleted: 0 };
    }

    public async getDeleteModelProgress(): Promise<IDeleteCmsModelTask> {
        return { id: "task-1", status: DeleteCmsModelTaskStatus.RUNNING, total: 0, deleted: 0 };
    }
}
```

Create `packages/api-headless-cms-workflows/__tests__/hooks/deleteModel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { DeleteModelUseCase } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { DeleteModelOperations } from "@webiny/api-headless-cms-tasks/graphql/deleteModel/abstractions.js";
import { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { ADMIN_ACTOR, createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { createDbModel } from "~tests/__helpers/dbModels.js";
import { expectOk } from "~tests/__helpers/entries.js";
import { READER } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import { RecordingDeleteModelOperations } from "~tests/__helpers/RecordingDeleteModelOperations.js";

class FailingListWorkflows implements ListWorkflowsUseCase.Interface {
    public constructor(private decoratee: ListWorkflowsUseCase.Interface) {}

    public async execute(): ListWorkflowsUseCase.Return {
        return Result.fail(new WorkflowPersistenceError(new Error("Storage is down.")));
    }
}

const failWorkflowLookups = (container: Container) => {
    container.registerDecorator(
        ListWorkflowsUseCase.createDecorator({ decorator: FailingListWorkflows, dependencies: [] })
    );
};

describe("Model delete block (D41, D64)", () => {
    it("refuses to delete a model bound to a workflow and lists the workflow", async () => {
        const { context } = createContextHandler();
        const ctx = await context();
        await createDbModel(ctx, "book");
        const workflow = expectOk(
            await storeWorkflow(ctx, { ...createWorkflowValues(["cms.book"]), name: "Book review" })
        );

        const blocked = await ctx.container.resolve(DeleteModelUseCase).execute("book");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Model/BoundToWorkflow");
        expect(blocked.error.data).toEqual({
            modelId: "book",
            workflows: [{ id: workflow.id, name: "Book review" }]
        });
        expect(blocked.error.message).toBe(
            'The model "book" is used by the workflow "Book review". Delete the workflow or remove the model from it first.'
        );
        expect((await ctx.container.resolve(GetModelUseCase).execute("book")).isOk()).toBe(true);
    });

    it("deletes the model once its workflow is gone", async () => {
        const { context } = createContextHandler();
        const ctx = await context();
        await createDbModel(ctx, "book");
        const workflow = expectOk(await storeWorkflow(ctx, createWorkflowValues(["cms.book"])));
        expectOk(
            await ctx.container
                .resolve(DeleteWorkflowUseCase)
                .execute({ id: workflow.id, actor: ADMIN_ACTOR })
        );

        // Under `test:os` the workflow list must not lag behind the delete (A37).
        const deleted = await ctx.container.resolve(DeleteModelUseCase).execute("book");

        expect(deleted.isOk()).toBe(true);
    });

    it("deletes a model without a workflow normally", async () => {
        const { context } = createContextHandler();
        const ctx = await context();
        await createDbModel(ctx, "magazine");

        const deleted = await ctx.container.resolve(DeleteModelUseCase).execute("magazine");

        expect(deleted.isOk()).toBe(true);
    });

    it("reports the CMS's own error to a caller who cannot delete the model", async () => {
        const admin = createContextHandler();
        const adminCtx = await admin.context();
        await createDbModel(adminCtx, "book");
        expectOk(await storeWorkflow(adminCtx, createWorkflowValues(["cms.book"])));
        const reader = createContextHandler({ identity: READER, permissions: CMS_READER });

        const refused = await (await reader.context())
            .container.resolve(DeleteModelUseCase)
            .execute("book");

        expect(refused.isFail()).toBe(true);
        expect(refused.error.code).not.toBe("Workflows/Model/BoundToWorkflow");
    });

    it("blocks deleting a model when the workflow lookup fails (fail closed)", async () => {
        const { context } = createContextHandler({ legacyPlugins: [failWorkflowLookups] });
        const ctx = await context();
        await createDbModel(ctx, "magazine");

        const blocked = await ctx.container.resolve(DeleteModelUseCase).execute("magazine");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Workflow/Persistence");
    });
});

describe("Fully delete model task (D134 point 4)", () => {
    const createTaskContext = async (legacyPlugins: unknown[] = []) => {
        const operations = new RecordingDeleteModelOperations();
        const { context } = createContextHandler({
            legacyPlugins: [
                (container: Container) => {
                    container.registerInstance(DeleteModelOperations, operations);
                },
                ...legacyPlugins
            ]
        });
        const ctx = await context();
        return { context: ctx, operations };
    };

    it("refuses to start the task for a bound model, before anything is deleted", async () => {
        const { context, operations } = await createTaskContext();
        await createDbModel(context, "book");
        expectOk(
            await storeWorkflow(context, {
                ...createWorkflowValues(["cms.book"]),
                name: "Book review"
            })
        );

        await expect(
            context.container.resolve(DeleteModelOperations).fullyDeleteModel("book")
        ).rejects.toMatchObject({
            code: "Workflows/Model/BoundToWorkflow",
            data: { modelId: "book" }
        });
        expect(operations.fullyDeleted).toEqual([]);
    });

    it("starts the task for a model without a workflow", async () => {
        const { context, operations } = await createTaskContext();
        await createDbModel(context, "magazine");

        const task = await context.container
            .resolve(DeleteModelOperations)
            .fullyDeleteModel("magazine");

        expect(task.id).toBe("task-1");
        expect(operations.fullyDeleted).toEqual(["magazine"]);
    });

    it("refuses to start the task when the workflow lookup fails (fail closed)", async () => {
        const { context, operations } = await createTaskContext([failWorkflowLookups]);
        await createDbModel(context, "magazine");

        await expect(
            context.container.resolve(DeleteModelOperations).fullyDeleteModel("magazine")
        ).rejects.toMatchObject({ code: "Workflows/Workflow/Persistence" });
        expect(operations.fullyDeleted).toEqual([]);
    });
});
```

Create `packages/api-headless-cms-workflows/__tests__/workflows/bindableDbModel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__handler/context.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { createDbModel } from "~tests/__helpers/dbModels.js";
import { EDITOR } from "~tests/__helpers/identities.js";
import { WORKFLOWS_EDITOR } from "~tests/__helpers/permissions.js";

describe("Bindable check on a database model (R38 carry-over)", () => {
    it("fails validation for a workflow editor without read access to the model", async () => {
        const admin = createContextHandler();
        await createDbModel(await admin.context(), "book");
        const editor = createContextHandler({ identity: EDITOR, permissions: [WORKFLOWS_EDITOR] });

        const result = await storeWorkflow(await editor.context(), createWorkflowValues(["cms.book"]));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe('You don\'t have access to the model "book".');
    });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/hooks/deleteModel.test.ts packages/api-headless-cms-workflows/__tests__/workflows/bindableDbModel.test.ts 2>&1 | tail -50`
Expected: `deleteModel.test.ts` FAILS: the bound model is deleted, the failing lookup is never called, the task starts for a bound model. `bindableDbModel.test.ts` PASSES already (R38 landed in 1b; this pins the DB-model path) — record that it was green before the implementation.

- [ ] **Step 4: Add the error and the shared checks**

Create `packages/api-headless-cms-workflows/src/domain/errors.ts`:

```ts
import { BaseError } from "@webiny/feature/api";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";

export interface BoundWorkflow {
    id: string;
    name: string;
}

export interface ModelBoundToWorkflowErrorData {
    modelId: string;
    workflows: BoundWorkflow[];
}

/**
 * A model bound to a workflow cannot be deleted, neither through `DeleteModelUseCase` nor the
 * "fully delete model" task (D41, D64, D134); the workflow must be deleted or the model removed
 * from it first.
 */
export class ModelBoundToWorkflowError extends BaseError<ModelBoundToWorkflowErrorData> {
    override readonly code = "Workflows/Model/BoundToWorkflow" as const;

    constructor(data: ModelBoundToWorkflowErrorData) {
        const names = data.workflows.map(workflow => `"${workflow.name}"`).join(", ");
        const noun = data.workflows.length === 1 ? "workflow" : "workflows";
        super({
            message: `The model "${data.modelId}" is used by the ${noun} ${names}. Delete the ${noun} or remove the model from it first.`,
            data
        });
    }
}

declare module "@webiny/api-headless-cms/features/contentModel/DeleteModel/abstractions.js" {
    interface IDeleteModelUseCaseErrors {
        /** Added by the CMS workflows package (R64). */
        boundToWorkflow: ModelBoundToWorkflowError;
        /** The bound-workflow lookup failed; the delete is blocked (R64). */
        workflowPersistence: WorkflowPersistenceError;
    }
}
```

Create `packages/api-headless-cms-workflows/src/features/hooks/listBoundWorkflows.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import type { BoundWorkflow } from "~/domain/errors.js";
import { toCmsNamespace } from "~/utils/appName.js";

/** v1 binds one workflow per model (D15); a few extra cover the accepted save race (D41). */
const BOUND_WORKFLOWS_LIMIT = 10;

/** The workflows bound to a CMS model, for the model delete guards (R64). */
export const listBoundWorkflows = async (
    listWorkflows: ListWorkflowsUseCase.Interface,
    modelId: string
): Promise<Result<BoundWorkflow[], WorkflowPersistenceError>> => {
    const workflows = await listWorkflows.execute({
        where: { models_in: [toCmsNamespace(modelId)] },
        limit: BOUND_WORKFLOWS_LIMIT
    });
    if (workflows.isFail()) {
        return Result.fail(workflows.error);
    }
    return Result.ok(
        workflows.value.items.map(workflow => {
            return { id: workflow.id, name: workflow.name };
        })
    );
};
```

Create `packages/api-headless-cms-workflows/src/features/hooks/canCallerDeleteModel.ts`:

```ts
import type { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import type { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";

/**
 * Whether the current identity can read and delete the model. The model delete guards check this
 * first, so a caller without access gets the CMS's own error from the decorated chain and never
 * the bound workflows' ids and names (R64).
 */
export const canCallerDeleteModel = async (
    getModel: GetModelUseCase.Interface,
    accessControl: AccessControl.Interface,
    modelId: string
): Promise<boolean> => {
    const model = await getModel.execute(modelId);
    if (model.isFail()) {
        return false;
    }
    return accessControl.canAccessModel({ model: model.value, rwd: "d" });
};
```

- [ ] **Step 5: Add the decorators**

Create `packages/api-headless-cms-workflows/src/features/hooks/DeleteModelBoundToWorkflowDecorator.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { DeleteModelUseCase } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { ModelBoundToWorkflowError } from "~/domain/errors.js";
import { canCallerDeleteModel } from "./canCallerDeleteModel.js";
import { listBoundWorkflows } from "./listBoundWorkflows.js";

/**
 * Blocks deleting a model bound to a workflow (spec 9.2, D41, D64, R64), following
 * `DeleteModelWithEntryCleanup`. Registered after the CMS's decorators, so it runs first and a
 * bound singleton model keeps its entries. A caller who cannot delete the model is left to the
 * CMS's own checks; a failed lookup blocks the delete with the workflows error.
 */
class DeleteModelBoundToWorkflowDecoratorImpl implements DeleteModelUseCase.Interface {
    public constructor(
        private getModel: GetModelUseCase.Interface,
        private accessControl: AccessControl.Interface,
        private listWorkflows: ListWorkflowsUseCase.Interface,
        private decoratee: DeleteModelUseCase.Interface
    ) {}

    public async execute(modelId: string): DeleteModelUseCase.Return {
        if (!(await canCallerDeleteModel(this.getModel, this.accessControl, modelId))) {
            return this.decoratee.execute(modelId);
        }

        const workflows = await listBoundWorkflows(this.listWorkflows, modelId);
        if (workflows.isFail()) {
            return Result.fail(workflows.error);
        }
        if (workflows.value.length > 0) {
            return Result.fail(new ModelBoundToWorkflowError({ modelId, workflows: workflows.value }));
        }
        return this.decoratee.execute(modelId);
    }
}

export const DeleteModelBoundToWorkflowDecorator = DeleteModelUseCase.createDecorator({
    decorator: DeleteModelBoundToWorkflowDecoratorImpl,
    dependencies: [GetModelUseCase, AccessControl, ListWorkflowsUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/hooks/FullyDeleteModelBoundToWorkflowDecorator.ts`:

```ts
import { DeleteModelOperations } from "@webiny/api-headless-cms-tasks/graphql/deleteModel/abstractions.js";
import type {
    IDeleteCmsModelTask,
    IStoreValue
} from "@webiny/api-headless-cms-tasks/features/DeleteModelTask/types.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { ModelBoundToWorkflowError } from "~/domain/errors.js";
import { canCallerDeleteModel } from "./canCallerDeleteModel.js";
import { listBoundWorkflows } from "./listBoundWorkflows.js";

/**
 * Refuses to start the "fully delete model" background task for a model bound to a workflow
 * (D134 point 4, R64). The task deletes every entry and folder before it calls
 * `DeleteModelUseCase`, so the use-case decorator alone would fire after the content is gone.
 * `fullyDeleteModel` reports errors by throwing (its GraphQL resolver maps them), so this throws
 * too. The other operations pass through.
 */
class FullyDeleteModelBoundToWorkflowDecoratorImpl implements DeleteModelOperations.Interface {
    public constructor(
        private getModel: GetModelUseCase.Interface,
        private accessControl: AccessControl.Interface,
        private listWorkflows: ListWorkflowsUseCase.Interface,
        private decoratee: DeleteModelOperations.Interface
    ) {}

    public listModelsBeingDeleted(): Promise<IStoreValue[]> {
        return this.decoratee.listModelsBeingDeleted();
    }

    public isModelBeingDeleted(modelId: string): Promise<boolean> {
        return this.decoratee.isModelBeingDeleted(modelId);
    }

    public async fullyDeleteModel(modelId: string): Promise<IDeleteCmsModelTask> {
        if (!(await canCallerDeleteModel(this.getModel, this.accessControl, modelId))) {
            return this.decoratee.fullyDeleteModel(modelId);
        }

        const workflows = await listBoundWorkflows(this.listWorkflows, modelId);
        if (workflows.isFail()) {
            throw workflows.error;
        }
        if (workflows.value.length > 0) {
            throw new ModelBoundToWorkflowError({ modelId, workflows: workflows.value });
        }
        return this.decoratee.fullyDeleteModel(modelId);
    }

    public cancelFullyDeleteModel(modelId: string): Promise<IDeleteCmsModelTask> {
        return this.decoratee.cancelFullyDeleteModel(modelId);
    }

    public getDeleteModelProgress(modelId: string): Promise<IDeleteCmsModelTask> {
        return this.decoratee.getDeleteModelProgress(modelId);
    }
}

export const FullyDeleteModelBoundToWorkflowDecorator = DeleteModelOperations.createDecorator({
    decorator: FullyDeleteModelBoundToWorkflowDecoratorImpl,
    dependencies: [GetModelUseCase, AccessControl, ListWorkflowsUseCase]
});
```

In `packages/api-headless-cms-workflows/src/features/hooks/feature.ts` import both decorators and add after the trash and delete handlers:

```ts

        // Model delete blocks (D64, D134 point 4); the use-case decorator runs before the CMS's
        // own DeleteModel decorators, the task decorator before the task is triggered.
        container.registerDecorator(DeleteModelBoundToWorkflowDecorator);
        container.registerDecorator(FullyDeleteModelBoundToWorkflowDecorator);
```

(A decorator registered for `DeleteModelOperations` where `api-headless-cms-tasks` registers no implementation is never resolved and does nothing.)

- [ ] **Step 6: Run the tests and the type check**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40` Expected: no errors (the augmentation makes both errors valid `DeleteModelUseCase.Error`s).
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9). If "deletes the model once its workflow is gone" is flaky there, the workflow list lags the delete (A37); report it, do not add sleeps.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`; its build type-checks the augmentation), then commit:

```
feat(api-headless-cms-workflows): block deleting a model, or starting its full delete, while a workflow is bound

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
