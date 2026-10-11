### Task 11: Model delete decorator and the DB-model bindable test

Spec 9.2, D41, D64, R64; carry-over from 1b (R38: "the DB-model path, which the harness cannot produce"). A `DeleteModelUseCase` decorator returns `Workflows/Model/BoundToWorkflow` listing the bound workflows; it is registered after the CMS's own decorators, so it runs first and `DeleteModelWithEntryCleanup` never deletes a bound singleton model's entries. Both tests need a database model (code models cannot be deleted, and the CMS hides code models from callers without access), created with full access in one request and used by a restricted identity in another (A32).

**Files:**
- Create: `packages/api-headless-cms-workflows/src/domain/errors.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/DeleteModelBoundToWorkflowDecorator.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/hooks/feature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/dbModels.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/hooks/deleteModel.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/workflows/bindableDbModel.test.ts`

**Interfaces:**
- Consumes: `DeleteModelUseCase` (`@webiny/api-headless-cms/features/contentModel/DeleteModel/index.js`), `ModelPersistenceError` (`@webiny/api-headless-cms/domain/contentModel/errors.js`), `ListWorkflowsUseCase`, `CreateGroupUseCase`, `CreateModelUseCase`, `toCmsNamespace`.
- Produces:
  - `ModelBoundToWorkflowError` (`Workflows/Model/BoundToWorkflow`), data `ModelBoundToWorkflowErrorData { modelId: string; workflows: BoundWorkflow[] }`, `BoundWorkflow { id: string; name: string }`; joined to `IDeleteModelUseCaseErrors` as `boundToWorkflow` by module augmentation.
  - `DeleteModelBoundToWorkflowDecorator` registered by `CmsHooksFeature`.
  - Test helper `createDbModel(context, modelId)` (`__tests__/__helpers/dbModels.ts`).

- [ ] **Step 1: Write the helper and the failing tests**

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

Create `packages/api-headless-cms-workflows/__tests__/hooks/deleteModel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DeleteModelUseCase } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { ADMIN_ACTOR, createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { createDbModel } from "~tests/__helpers/dbModels.js";
import { expectOk } from "~tests/__helpers/entries.js";

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

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/hooks/deleteModel.test.ts packages/api-headless-cms-workflows/__tests__/workflows/bindableDbModel.test.ts 2>&1 | tail -50`
Expected: `deleteModel.test.ts` FAILS ("refuses to delete a model bound to a workflow": the delete succeeds). `bindableDbModel.test.ts` PASSES already (R38 landed in 1b; this pins the DB-model path) — record that it was green before the implementation.

- [ ] **Step 3: Add the error**

Create `packages/api-headless-cms-workflows/src/domain/errors.ts`:

```ts
import { BaseError } from "@webiny/feature/api";

export interface BoundWorkflow {
    id: string;
    name: string;
}

export interface ModelBoundToWorkflowErrorData {
    modelId: string;
    workflows: BoundWorkflow[];
}

/**
 * A model bound to a workflow cannot be deleted (D41, D64); the workflow must be deleted or the
 * model removed from it first.
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
    }
}
```

- [ ] **Step 4: Add the decorator**

Create `packages/api-headless-cms-workflows/src/features/hooks/DeleteModelBoundToWorkflowDecorator.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { DeleteModelUseCase } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/index.js";
import { ModelPersistenceError } from "@webiny/api-headless-cms/domain/contentModel/errors.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { ModelBoundToWorkflowError } from "~/domain/errors.js";
import { toCmsNamespace } from "~/utils/appName.js";

/** v1 binds one workflow per model (D15); a few extra cover the accepted save race (D41). */
const BOUND_WORKFLOWS_LIMIT = 10;

/**
 * Blocks deleting a model bound to a workflow (spec 9.2, D41, D64, R64), following
 * `DeleteModelWithEntryCleanup`. Registered after the CMS's decorators, so it runs first and a
 * bound singleton model keeps its entries. A failed lookup blocks the delete.
 */
class DeleteModelBoundToWorkflowDecoratorImpl implements DeleteModelUseCase.Interface {
    public constructor(
        private listWorkflows: ListWorkflowsUseCase.Interface,
        private decoratee: DeleteModelUseCase.Interface
    ) {}

    public async execute(modelId: string): DeleteModelUseCase.Return {
        const workflows = await this.listWorkflows.execute({
            where: { models_in: [toCmsNamespace(modelId)] },
            limit: BOUND_WORKFLOWS_LIMIT
        });
        if (workflows.isFail()) {
            return Result.fail(new ModelPersistenceError(workflows.error));
        }
        if (workflows.value.items.length > 0) {
            return Result.fail(
                new ModelBoundToWorkflowError({
                    modelId,
                    workflows: workflows.value.items.map(workflow => {
                        return { id: workflow.id, name: workflow.name };
                    })
                })
            );
        }
        return this.decoratee.execute(modelId);
    }
}

export const DeleteModelBoundToWorkflowDecorator = DeleteModelUseCase.createDecorator({
    decorator: DeleteModelBoundToWorkflowDecoratorImpl,
    dependencies: [ListWorkflowsUseCase]
});
```

In `packages/api-headless-cms-workflows/src/features/hooks/feature.ts` import `DeleteModelBoundToWorkflowDecorator` and add after the adapter rules:

```ts

        // Model delete block (D64); runs before the CMS's own DeleteModel decorators.
        container.registerDecorator(DeleteModelBoundToWorkflowDecorator);
```

- [ ] **Step 5: Run the tests and the type check**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40` Expected: no errors (the augmentation makes `ModelBoundToWorkflowError` a valid `DeleteModelUseCase.Error`).
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`; its build type-checks the augmentation), then commit:

```
feat(api-headless-cms-workflows): block deleting a model that a workflow is bound to

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
