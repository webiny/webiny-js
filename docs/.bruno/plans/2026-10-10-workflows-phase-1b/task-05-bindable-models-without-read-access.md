### Task 5: Check bindable CMS models without the caller's model access

**Files:**
- Modify: `packages/api-headless-cms-workflows/src/features/Workflows/assertModelsBindable.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeCreate.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeUpdate.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts`

**Interfaces:**
- Consumes: `GetModelRepository` (`@webiny/api-headless-cms/features/contentModel/GetModel/index.js`: `execute(modelId: string): Promise<Result<CmsModel, ModelNotFoundError | ModelPersistenceError>>`, no access control; registered by the CMS `GetModelFeature` in singleton scope), `WorkflowBeforeCreateEventHandler` / `WorkflowBeforeUpdateEventHandler`, `WorkflowValidationError`, the package test helpers `createContextHandler` (`~tests/__handler/context.js`, passes `permissions` through to `createCmsTestHandler`) and `storeWorkflow` / `createWorkflowValues` (`~tests/__workflows/workflow.js`).
- Produces:
  - `assertModelsBindable(getModel: GetModelRepository.Interface, models: string[]): Promise<void>` (was `GetModelUseCase.Interface`). Same messages and error codes; a caller without read access to the model now gets the binding answer (`Workflows/Workflow/Validation` or success) instead of a thrown `Cms/Model/NotAuthorized` (R38).

- [ ] **Step 1: Write the failing tests**

In `packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts`, add after the `expectedMessage` constant:

```ts

/** A workflow editor with no CMS permissions, so no read access to the model. */
const EDITOR_WITHOUT_MODEL_ACCESS = [{ name: "workflows", editor: true }];
```

and append inside the `describe("Disallow unpublishable models", ...)` block, after the last `it`:

```ts

    it("checks the model without the caller's model read access (D132)", async () => {
        const { context } = createContextHandler({
            permissions: EDITOR_WITHOUT_MODEL_ACCESS,
            modifyModel: model => {
                return {
                    ...model,
                    tags: ["$publishing:false"]
                };
            }
        });

        const result = await storeWorkflow(await context());

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(expectedMessage);
    });

    it("binds a publishable model without the caller's model read access (D132)", async () => {
        const { context } = createContextHandler({ permissions: EDITOR_WITHOUT_MODEL_ACCESS });

        const result = await storeWorkflow(await context());

        expect(result.isOk()).toBe(true);
    });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts 2>&1 | tail -50`
Expected: FAIL, both new tests reject with `Not allowed to access content model "<modelId>".` (`Cms/Model/NotAuthorized`, thrown by `assertModelsBindable` out of `StoreWorkflowUseCase`, A6). The five existing tests pass. If a new test instead fails before the handler runs (any other error), stop and report: the D132 premise that the engine use cases run for a caller without CMS permissions does not hold (A15).

- [ ] **Step 3: Read the model through the repository**

Replace `packages/api-headless-cms-workflows/src/features/Workflows/assertModelsBindable.ts` with:

```ts
import type { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowValidationError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { getModelIdFromAppName } from "~/utils/appName.js";

const MODEL_NOT_FOUND = "Cms/Model/NotFound";

/**
 * Spec 4.1, D41: a workflow can only bind an existing, public, publishable CMS model. Throws
 * `WorkflowValidationError`, which `StoreWorkflowUseCase` returns as a failed result. Non-CMS
 * namespaces (`wb.page`) are skipped; the namespace format itself is checked by
 * `WorkflowValidator` before any event is published. Other model read errors propagate.
 *
 * Reads through `GetModelRepository`, not `GetModelUseCase`: the api-workflows use cases are an
 * internal engine (D132), so whether a model can be bound does not depend on the caller's model
 * read access. Who may edit workflows is the app wrapper's check (phase 2, R38).
 */
export const assertModelsBindable = async (
    getModel: GetModelRepository.Interface,
    models: string[]
): Promise<void> => {
    for (const namespaceId of models) {
        const modelId = getModelIdFromAppName(namespaceId);
        if (!modelId) {
            continue;
        }
        const model = await getModel.execute(modelId);
        if (model.isFail()) {
            if (model.error.code === MODEL_NOT_FOUND) {
                throw new WorkflowValidationError(`The model "${modelId}" does not exist.`);
            }
            throw model.error;
        }
        if (model.value.isPrivate) {
            throw new WorkflowValidationError(
                `Cannot bind a workflow to the model "${modelId}" because it is a private model.`
            );
        }
        const tags = model.value.tags || [];
        if (!tags.includes("$publishing:false")) {
            continue;
        }
        throw new WorkflowValidationError(
            `Cannot bind a workflow to the model "${modelId}" because it is marked as unpublishable.`
        );
    }
};
```

Replace `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeCreate.ts` with:

```ts
import { WorkflowBeforeCreateEventHandler } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { assertModelsBindable } from "../assertModelsBindable.js";

class DisallowUnpublishableModelsOnBeforeCreateImpl
    implements WorkflowBeforeCreateEventHandler.Interface
{
    public constructor(private getModel: GetModelRepository.Interface) {}

    public async handle(event: WorkflowBeforeCreateEventHandler.Event): Promise<void> {
        await assertModelsBindable(this.getModel, event.payload.workflow.models);
    }
}

export const DisallowUnpublishableModelsOnBeforeCreate =
    WorkflowBeforeCreateEventHandler.createImplementation({
        implementation: DisallowUnpublishableModelsOnBeforeCreateImpl,
        dependencies: [GetModelRepository]
    });
```

Replace `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeUpdate.ts` with:

```ts
import { WorkflowBeforeUpdateEventHandler } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { assertModelsBindable } from "../assertModelsBindable.js";

class DisallowUnpublishableModelsOnBeforeUpdateImpl
    implements WorkflowBeforeUpdateEventHandler.Interface
{
    public constructor(private getModel: GetModelRepository.Interface) {}

    public async handle(event: WorkflowBeforeUpdateEventHandler.Event): Promise<void> {
        await assertModelsBindable(this.getModel, event.payload.workflow.models);
    }
}

export const DisallowUnpublishableModelsOnBeforeUpdate =
    WorkflowBeforeUpdateEventHandler.createImplementation({
        implementation: DisallowUnpublishableModelsOnBeforeUpdateImpl,
        dependencies: [GetModelRepository]
    });
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts 2>&1 | tail -50`
Expected: PASS (7 tests).
Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: not runnable locally (A9); record "not run" and leave it to CI.

- [ ] **Step 5: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`), then:

```bash
git commit -m "fix(api-headless-cms-workflows): check bindable models without model read access

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
